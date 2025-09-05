def notifyDiscord(channel, chatId, message) {
    sh """
        curl --location --request POST "https://discord.com/api/webhooks/${channel}/${chatId}" \
        --header 'Content-Type: application/json' \
        --data-raw '{"content": "${message}"}'
    """
}

pipeline {
    agent any

    environment {
        ENVIRONMENT = 'kanban'
        SERVICE = 'kanban-web'

        REGISTRY_DOMAIN_NAME = 'registry.tantai.dev'
        REGISTRY_USERNAME = 'admin'
        REGISTRY_PASSWORD = credentials('registryPassword')

        K8S_NAMESPACE = 'kanban'
        K8S_DEPLOYMENT_NAME = 'kanban-web'
        K8S_CONTAINER_NAME = 'kanban-web'
        K8S_API_SERVER = 'https://172.16.21.111:6443'
        K8S_TOKEN = credentials('k8s-token')
        
        TEXT_START = "⚪ Service ${SERVICE} ${ENVIRONMENT} Build Started"
        TEXT_BUILD_AND_PUSH_APP_FAIL = "🔴 Service ${SERVICE} ${ENVIRONMENT} Build and Push Failed"
        TEXT_DEPLOY_APP_FAIL = "🔴 Service ${SERVICE} ${ENVIRONMENT} Deploy Failed"
        TEXT_CLEANUP_OLD_IMAGES_FAIL = "🔴 Cleanup Old Images Failed"
        TEXT_END = "🟢 Service ${SERVICE} ${ENVIRONMENT} Build Finished"

        DISCORD_CHANNEL = credentials('kanban-discord-channel')
        DISCORD_CHAT_ID = credentials('kanban-discord-chat-id')
    }

    stages {
        stage('Notify Build Started') {
            steps {
                script {
                    def causes = currentBuild.getBuildCauses()
                    def triggerInfo = causes ? causes[0].shortDescription : "Unknown"
                    def cleanTrigger = triggerInfo.replaceFirst("Started by ", "")
                    notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, "${env.TEXT_START} by ${cleanTrigger}.")
                }
            }
        }

        stage('Pull Code') {
            steps {
                script {
                    echo "Now Jenkins is pulling code..." 
                    checkout scm
                    echo "Now Jenkins is listing code..."
                    sh "ls -la ${WORKSPACE}"
                    sh "find ${WORKSPACE} -name 'Dockerfile' -type f || echo 'Dockerfile not found'"
                }
            }
        }

        stage('Build Web Image') {
            steps {
                script {
                    try {
                        def timestamp = new Date().format('yyMMdd-HHmmss')
                        env.DOCKER_WEB_IMAGE_NAME = "${env.REGISTRY_DOMAIN_NAME}/${env.ENVIRONMENT}/${env.SERVICE}:${timestamp}"

                        sh "docker build -t ${env.DOCKER_WEB_IMAGE_NAME} -f ${WORKSPACE}/Dockerfile ${WORKSPACE}"

                        echo "Successfully built WEB: ${env.DOCKER_WEB_IMAGE_NAME}"                    
                    } catch (Exception e) {
                        notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, env.TEXT_BUILD_AND_PUSH_APP_FAIL)
                        error("WEB build failed: ${e.getMessage()}")
                    }
                }
            }
        }

        stage('Push Web Image') {
            steps {
                script {
                    try {
                        sh 'echo $REGISTRY_PASSWORD | docker login $REGISTRY_DOMAIN_NAME -u $REGISTRY_USERNAME --password-stdin'
                        sh "docker push ${env.DOCKER_WEB_IMAGE_NAME}"
                        sh "docker rmi ${env.DOCKER_WEB_IMAGE_NAME} || true"
                        echo "Successfully pushed WEB: ${env.DOCKER_WEB_IMAGE_NAME}"                    
                    } catch (Exception e) {
                        notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, env.TEXT_BUILD_AND_PUSH_APP_FAIL)
                        error("WEB push failed: ${e.getMessage()}")
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    try {
                        echo "Deploying new image to K8s: ${env.DOCKER_WEB_IMAGE_NAME}"
                        
                        def patchData = '{"spec":{"template":{"spec":{"containers":[{"name":"' + env.K8S_CONTAINER_NAME + '","image":"' + env.DOCKER_WEB_IMAGE_NAME + '"}]}}}}'
                        
                        def deployResult = sh(
                            script: """
                                curl -X PATCH \\
                                    -H "Authorization: Bearer \$K8S_TOKEN" \\
                                    -H "Content-Type: application/strategic-merge-patch+json" \\
                                    -d '${patchData}' \\
                                    "\$K8S_API_SERVER/apis/apps/v1/namespaces/\$K8S_NAMESPACE/deployments/\$K8S_DEPLOYMENT_NAME" \\
                                    --insecure \\
                                    --silent \\
                                    --fail
                            """,
                            returnStatus: true
                        )
                        
                        if (deployResult != 0) {
                            error("Failed to update deployment. HTTP status: ${deployResult}")
                        }
                        
                        echo "Successfully triggered K8s deployment update"
                        
                    } catch (Exception e) {
                        notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, env.TEXT_DEPLOY_APP_FAIL)
                        error("Kubernetes deployment failed: ${e.getMessage()}")
                    }
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    try {
                        echo "Verifying deployment health..."
                        
                        timeout(time: 5, unit: 'MINUTES') {
                            script {
                                def ready = false
                                def attempts = 0
                                def maxAttempts = 30
                                
                                while (!ready && attempts < maxAttempts) {
                                    attempts++
                                    
                                    def result = sh(
                                        script: '''
                                            curl -s -H "Authorization: Bearer $K8S_TOKEN" \\
                                                "$K8S_API_SERVER/apis/apps/v1/namespaces/$K8S_NAMESPACE/deployments/$K8S_DEPLOYMENT_NAME" \\
                                                --insecure | grep -o '"readyReplicas":[0-9]*' | cut -d':' -f2 || echo '0'
                                        ''',
                                        returnStdout: true
                                    ).trim()
                                    
                                    def readyReplicas = result as Integer
                                    echo "Attempt ${attempts}/${maxAttempts}: Ready replicas: ${readyReplicas}"
                                    
                                    if (readyReplicas >= 1) {
                                        ready = true
                                        echo "Deployment is ready with ${readyReplicas} replica(s)"
                                        
                                    } else {
                                        echo "Waiting for deployment to be ready..."
                                        sleep(10)
                                    }
                                }
                                
                                if (!ready) {
                                    error("Deployment failed to become ready after ${maxAttempts} attempts")
                                }
                            }
                        }
                        
                    } catch (Exception e) {
                        def errorMsg = e.getMessage().replaceAll('"', '\\\\"')
                        echo "Verification failed but deployment may still be successful: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Cleanup Old Images') {
            steps {
                script {
                    try {
                        sh "docker image prune -a -f --filter \"until=24h\" || true"

                        sh """
                            docker images ${env.REGISTRY_DOMAIN_NAME}/${env.ENVIRONMENT}/${env.SERVICE} \\
                            --format "{{.Repository}}:{{.Tag}}\\t{{.CreatedAt}}" \\
                            | tail -n +2 | sort -k2 -r | tail -n +3 | awk '{print \$1}' \\
                            | xargs -r docker rmi || true
                        """

                        echo "Successfully cleaned up old images"
                        
                    } catch (Exception e) {
                        notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, env.TEXT_CLEANUP_OLD_IMAGES_FAIL)
                        echo "Cleanup failed but deployment was successful: ${e.getMessage()}"
                    }
                }
            }
        }

        stage('Notify Build Finished') {
            steps {
                script {
                    notifyDiscord(env.DISCORD_CHANNEL, env.DISCORD_CHAT_ID, "${env.TEXT_END}")
                }
            }
        }
    }
}
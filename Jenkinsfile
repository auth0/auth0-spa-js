@Library('k8sAgents') agentLibrary
@Library('auth0') _

pipeline {
  agent {
    kubernetes {
      yaml defaultAgent()
    }
  }

  tools {
    nodejs '14.16.1'
  }

  options {
    timeout(time: 10, unit: 'MINUTES')
  }

  stages {
    stage('Build') {
      steps {
        sshagent(['auth0extensions-ssh-key']) {
          sh 'npm ci'
          sh 'npm run build'
        }
      }
    }
    stage('Test') {
      steps {
        script {
          try {
            sh 'npm run test'
            githubNotify context: 'jenkinsfile/auth0/tests', description: 'Tests passed', status: 'SUCCESS'
          } catch (error) {
            githubNotify context: 'jenkinsfile/auth0/tests', description: 'Tests failed', status: 'FAILURE'
            throw error
          }
        }
      }
    }
    stage('Publish to CDN') {
      when { 
        anyOf { 
          branch 'beta'
          branch 'main'
        } 
      }
      steps {
        sshagent(['auth0extensions-ssh-key']) {
          sh 'npm run publish:cdn'
        }
      }
    }
  }

  post {
    cleanup {
      deleteDir()
    }
  }
}

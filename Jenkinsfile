pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Get code.'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Build up.'
            }
        }

        stage('Test') {
            steps {
                echo 'Auto test.'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploy'
            }
        }
    }

    post {
        success { echo 'Success' }
        failure { echo 'Fail' }
    }
}


import React from 'react'
import Router from 'next/router'

import { Receiver } from '../components/Page'

export default class AuthSuccessPage extends React.Component {

    handleSuccess = (accessToken) => {
        console.log("accessToken!", accessToken)
        localStorage.setItem("db-access-token", accessToken)
        Router.push('/')
    }

    handleError = (err) => {
        console.error("Error in auth", err)
    }

    render() {
        return (
            <Receiver
                onAuthSuccess={this.handleSuccess}
                onAuthError={this.handleError}
                render={({ processing, state, error }) => {
                    if (processing) {
                        return <p>Processing ...</p>
                    }

                    if (error) {
                        return (
                            <p style={{ color: 'red' }}>
                                Error: {error.message}
                            </p>
                        )
                    }
                    return <p>REDIRECT!</p>
                }}
            />
        )
    }
}

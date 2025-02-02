import { NotFoundException } from '@nestjs/common';
// We can find the full list of built-in HTTP exceptions in the documentation.

// When creating custom exceptions, you must either extend the HttpException or make use of 
// the built-in HTTP exceptions, failure to do this will trigger a 500 internal server error.

export default class AgentNotFoundException extends NotFoundException {
    constructor(agentId: string) {
        super(`Agent with id ${agentId} not found`)
    }
}
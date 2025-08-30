import { FastifyRequest, FastifyReply } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UserParams {
  id: string
}

interface CreateUserBody {
  email: string
  username: string
}

// GET /users/:id - Get user by ID
export async function getUserById(
  request: FastifyRequest<{ Params: UserParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found'
      })
    }
    
    return reply.send({ user })
  } catch (error) {
    request.log.error(error)
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to fetch user'
    })
  }
}

// GET /users - Get all users
export async function getAllUsers(
  request: FastifyRequest,
  reply: FastifyReply
) {
	try {
	const users = await prisma.user.findMany()
	return reply.send({ users })
  } catch (error) {
	request.log.error(error)
	return reply.status(500).send({
	  error: 'Internal Server Error',
	  message: 'Failed to fetch users'
	})
  }
}

// POST /users - Create new user
export async function createUser(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  try {
    const { email, username } = request.body
    
    // Basic validation
    if (!email || !username) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Email and username are required'
      })
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username
      }
    })
    
    return reply.status(201).send({ user })
  } catch (error: any) {
    request.log.error(error)
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Email or username already exists'
      })
    }
    
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to create user'
    })
  }
}

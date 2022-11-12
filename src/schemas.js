import joi from 'joi'

export const createUser = joi.object({
    name: joi.string().required()
} )
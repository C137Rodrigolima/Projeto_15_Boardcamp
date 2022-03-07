import joi from "joi";

const gameSchema = joi.object({
    name: joi.string().required(),
    image: joi.string().required(),
    categoryId: joi.number().integer().required(),
    stockTotal: joi.number().integer().positive().min(1).required(),
    pricePerDay: joi.number().integer().positive().min(1).required()

});

export default gameSchema;
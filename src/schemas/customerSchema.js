import BaseJoi from 'joi';
import JoiDate from '@hapi/joi-date';
const joi = BaseJoi.extend(JoiDate);

const customerSchema = joi.object({
    name: joi.string().required(),
    phone: joi.string().regex(/^[0-9]{10,11}$/).required(),
    cpf: joi.string().regex(/^[0-9]{11}$/).required(),
    birthday: joi.date().format('YYYY-MM-DD').required()
});

export default customerSchema;
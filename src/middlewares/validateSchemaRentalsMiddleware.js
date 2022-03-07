export default function validateSchemaRentalsMiddleware(schema){
    return (req, res, next) => {
        const validation = schema.validate(req.body);
        if(validation.error){
            return res.sendStatus(400).send('Schema Inválido');
        }
        next();
    }
}
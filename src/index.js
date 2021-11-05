const express  = require('express')

const{ v4:uuidv4 } = require('uuid') //Gerar numeros randômicos de uuid

const  app = express()

app.use(express.json())

const costumers = []

/*
    cpf - string
    name - string
    id - uuid 
    statement - [] (lançamentos, extratos da conta)
*/
//Criação de conta
app.post('/account', (request, response)=>{ 
    const {cpf, name} = request.body

    const costumerAlreadyExists = costumers.some((costumer) => costumer.cpf === cpf) //Retorna true or false

    if(costumerAlreadyExists){
        return response.status(400).json({error:"Costumer already exists!"})
    }

    costumers.push({
        cpf,
        name,
        id: uuidv4(),
        statement:[]
    })

    return response.status(201).send()

})


//Acessando o extrato bancário
app.get('/statement', (request, response)=>{
    const { cpf } = request.headers //Para buscar a informação do header
   
    const  costumer = costumers.find(costumer => costumer.cpf === cpf) //Retorna o objeto inteiro

    if (!costumer){
        return response.status(400).json({error:"Costumer not found!"})
    }

    return response.json(costumer.statement)

})







app.listen(3333) 

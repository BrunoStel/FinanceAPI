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

// Criação do Middleware - Para validação de dados, verificação de tokens, etc
function verifyIfExissAccountCPF(request, response, next){
    const { cpf } = request.headers //Para buscar a informação do header
   
    const  costumer = costumers.find(costumer => costumer.cpf === cpf) //Retorna o objeto inteiro

    if (!costumer){
        return response.status(400).json({error:"Costumer not found!"})
    }

    request.costumer = costumer //Passando o objeto costumer para as demais rotas

    return next() //Caso o processamento ocorra corretamente, ele dá continuidade pra função em que ele se encontra dentro
}

function getBalance(statement){
    const balance = statement.reduce((acc, obj)=>{
        if(obj.type === 'credit'){
           return acc + obj.amount
        }else{ return acc - obj.amount }
    },0)

    return balance

}


// app.use(verifyIfExissAccountCPF) //Escrevendo assim, todas as rotas a seguir precisam cumprir os requisitos do middleware para prosseguir

//Acessando o extrato bancário
app.get('/statement',verifyIfExissAccountCPF, (request, response)=>{
    const {costumer} = request //Mesma coisa de fazer const costumer = request.costumer
    return response.json(costumer.statement)

})


//Inserindo um deposito
app.post("/deposit",verifyIfExissAccountCPF, (request, response)=>{
    const {costumer} = request //Mesma coisa de fazer const costumer = request.costumer

    const {description, amount} = request.body

    const statementOperation ={
        description,
        amount,
        created_at: new Date(),
        type: 'credit'
    }

    costumer.statement.push(statementOperation)

    return response.status(201).send()

})




//Inserindo um saque
app.post("/withdraw",verifyIfExissAccountCPF, (request, response)=>{
    const {costumer} = request //Mesma coisa de fazer const costumer = request.costumer

    const {amount} = request.body

    const balance = getBalance(costumer.statement)

    if (balance < amount){
        return response.status(400).json({error:'Insufficient funds!'})
    }

    const statementOperation ={
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    costumer.statement.push(statementOperation)

    return response.status(201).send()

})







app.listen(3333) 

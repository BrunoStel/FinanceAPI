const { application } = require('express')
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
function verifyIfExistAccountCPF(request, response, next){
    const { cpf } = request.headers //Para buscar a informação do header
   
    const  costumer = costumers.find(costumer => costumer.cpf === cpf) //Retorna o objeto inteiro

    if (!costumer){
        return response.status(400).json({error:"Costumer not found!"})
    }

    request.costumer = costumer //Passando o objeto costumer para as demais rotas

    return next() //Caso o processamento ocorra corretamente, ele dá continuidade pra função em que ele se encontra dentro
}


//Criando a função que calcula o saldo da conta
function getBalance(statement){
    const balance = statement.reduce((acc, obj)=>{
        if(obj.type === 'credit'){
           return acc + obj.amount
        }else{ return acc - obj.amount }
    },0)

    return balance

}


// app.use(verifyIfExissAccountCPF) //Escrevendo assim, todas as rotas a seguir precisam cumprir os requisitos do middleware para prosseguir


//Inserindo um deposito
app.post("/deposit",verifyIfExistAccountCPF, (request, response)=>{
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
app.post("/withdraw",verifyIfExistAccountCPF, (request, response)=>{
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

//Acessando o extrato bancário
app.get('/statement',verifyIfExistAccountCPF, (request, response)=>{
    const {costumer} = request //Mesma coisa de fazer const costumer = request.costumer

    const balance = getBalance(costumer.statement)

    return response.status(200).json({extrato:costumer.statement,Saldo:balance})
})


//Acessando o extrato bancário por data
app.get('/statement/date',verifyIfExistAccountCPF, (request, response)=>{
    const {costumer} = request //Mesma coisa de fazer const costumer = request.costumer

    const {date} = request.query

    const dateFormat = new Date(date + " 00:00") //Formatando a data

    const statement = costumer.statement.filter(
        (obj)=>
         obj.created_at.toDateString() === 
         new Date (dateFormat).toDateString()
        )

    if(statement.length == 0 ){
        return response.status(400).json({error:'Não há extratos para esse dia!'})
    }

    return response.status(200).json({extrato:statement})
})

//Atualizando dados
app.put('/account',verifyIfExistAccountCPF,(request, response)=>{
    const {name} = request.body
    const {costumer} = request

    costumer.name = name

    return response.status(201).send()
})

//Obtendo os dados da conta
app.get('/account',verifyIfExistAccountCPF,(request, response)=>{
    const {costumer} = request


    return response.status(201).json(costumer)
})

//Deletando conta
app.delete('/account',verifyIfExistAccountCPF,(request, response)=>{
    const {costumer} = request

    const { cpf } = request.headers;

    const costumerIndex = costumers.findIndex(costumer => costumer.cpf === cpf)


    costumers.splice(costumerIndex,1)

    return response.status(200).json(costumers)
})


//Verificando o balanço
app.get('/balance',verifyIfExistAccountCPF,(request, response)=>{
    const {costumer} = request

   const balance = getBalance(costumer.statement)


    return response.status(201).json(balance)
})


app.listen(3333) 

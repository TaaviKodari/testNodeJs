import express  from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));


//chat-gpt versio:  npm install dotenv
app.post('/chat', async(req, res)=>{
    const question = req.body.question;
    console.log(question);
    try{
        const response = await fetch('https://api.openai.com/v1/chat/completions',{
            method:'POST',
            headers:{
                'Content-Type':'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model:'gpt-4o-mini',
                messages:[
                    {role:'user', content: question}
                ],
                max_tokens: 150
            })
        });

        const data = await response.json();
        console.log('Api response:',data.choices[0].message);
        
        const reply = data.choices[0].message.content;
        res.json({reply});

    }catch(error){
        console.error('Virheviesti:', error.message);
        res.status(500).json({error: 'Internal Server Error'});
    }

    // if(question){
    //     res.json({question:`Käyttäjä kysyi ${question}`});
    // }else{
    //     res.status(400).json({error:'kysymys puuttui.'})
    // }
});


//luetaan frontin kysymys requestista versio
// app.post('/chat', async(req, res)=>{
//     const question = req.body.question;
//     console.log(question);
//     if(question){
//         res.json({question:`Käyttäjä kysyi ${question}`});
//     }else{
//         res.status(400).json({error:'kysymys puuttui.'})
//     }
// });


app.listen(port, () =>{
    console.log(`Server running at http://localhost:${port}`);
})

//Pohja post kutsu.  Ei oo pakko tehdä
app.post('/chat', async(req, res)=>{
    try{

    }catch(error){
        console.log('Virheviesti:', error.message);
        res.status(500).json({error:'internal server error'})
    }
})
let currentQuestion ='';
let correctAnswer = '';
document.getElementById('send-button').addEventListener('click',sendMessage);
document.getElementById('send-images-button').addEventListener('click',sendImages);
document.getElementById('send-answer-button').addEventListener('click',sendAnswer);
document.getElementById('user-input').addEventListener('keypress',function(e){
    if(e.key == 'Enter'){
        sendMessage();
    }
})

async function fechNextQuestion(){
    try{
      const response = await fetch('/next-question',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
           
        });
        const data = await response.json();
        currentQuestion = data.question;
        correctAnswer = data.answer;
        addMessageToChatbox('Omaope: ' + data.question, 'bot-message', 'omaopebox');
    }catch(error)
    {
        console.error('Error', error);
    }
}

async function sendAnswer() {
    const answerInput = document.getElementById('answer-input').value;
    if(answerInput.trim()=== '') return;
    console.log(answerInput);
    addMessageToChatbox('Sinä: ' + answerInput,'user-message','omaopebox');
    try{
        const response = await fetch('/check-answer',{
            method:'POST',
            headers:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({user_answer:answerInput, correct_answer: correctAnswer})
        });
        const data = await response.json();
        console.log(data.evaluation);
        addMessageToChatbox('ChatGPT: ' + data.evaluation,'bot-message','omaopebox');
        fechNextQuestion();
    }catch(error)
    {
        console.log('Error:',error);
    }
    document.getElementById('answer-input').value = '';
}


async function sendImages()
{
    //testaan, että toimii
    //console.log("Kuvia lähetetty");

    const imageInput = document.getElementById('image-input');
    const files = imageInput.files;
    if(files.length === 0)
    {
        alert('Valitse kuvia ensin.');
        return;
    }
    const formData = new FormData();
    
    for(let i = 0; i< files.length;i++){
        formData.append('images',files[i])
    }
    //perus formDatan logitus
   // console.log(formData);
    //Hae form data sisältö
    console.log(formData.getAll('images'));
    try{
        //muista päivittää asynciksi funtio
        const response = await fetch('/upload-Images',{
            method: 'POST',
            body: formData
        })
        const data = await response.json();
        console.log(data);
        currentQuestion = data.question;
        correctAnswer = data.answer;
        console.log('Current question:'+ currentQuestion);
        console.log('Correct answer:' + correctAnswer);
        addMessageToChatbox('OmaOpe: ' + currentQuestion,'bot-message','omaopebox');
    }catch(error)
    {
        console.error('Error:',error);
    }
}

async function sendMessage()
{
    const userInput = document.getElementById('user-input').value;
    
    if(userInput.trim() === '') return;

    addMessageToChatbox('Sinä: ' + userInput,'user-message','chatbox');
    console.log(userInput);
    try{
        const response = await fetch('chat',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({question:userInput})
        })
        
            const data = await response.json();
            console.log(data.reply);
            addMessageToChatbox(data.reply,'bot-message','chatbox');
            //test
    }catch(error)
    {
        console.error("Error:", error);
        addMessageToChatbox("Jotain meni pieleen. Yritä uudelleen myöhemmin",'bot-message','chatbox');
    }
    document.getElementById('user-input').value = '';
}

function addMessageToChatbox(message, className, box){
    const messageElement = document.createElement('div');
    messageElement.classList.add('message',className);
    messageElement.textContent = message;
    document.getElementById(box).appendChild(messageElement);

}
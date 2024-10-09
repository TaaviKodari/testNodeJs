document.getElementById('send-button').addEventListener('click',sendMessage);
document.getElementById('send-images-button').addEventListener('click',sendImages);
document.getElementById('user-input').addEventListener('keypress',function(e){
    if(e.key == 'Enter'){
        sendMessage();
    }
})

function sendImages()
{
    console.log("Kuvia lähetetty");
}

async function sendMessage()
{
    const userInput = document.getElementById('user-input').value;
    
    if(userInput.trim() === '') return;

    addMessageToChatbox('Sinä: ' + userInput,'user-message');
    console.log(userInput);
    try{
        const response = await fetch('chat',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({question:userInput})
        })
        
            const data = await response.json();
            console.log(data.reply);
            addMessageToChatbox(data.reply,'bot-message');
    }catch(error)
    {
        console.error("Error:", error);
        addMessageToChatbox("Jotain meni pieleen. Yritä uudelleen myöhemmin",'bot-message');
    }
    document.getElementById('user-input').value = '';
}

function addMessageToChatbox(message, className){
    const messageElement = document.createElement('div');
    messageElement.classList.add('message',className);
    messageElement.textContent = message;
    document.getElementById('chatbox').appendChild(messageElement);

}
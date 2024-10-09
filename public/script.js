document.getElementById('send-button').addEventListener('click',sendMessage);
document.getElementById('user-input').addEventListener('keypress',function(e){
    if(e.key == 'Enter'){
        sendMessage();
    }
})
async function sendMessage()
{
    const userInput = document.getElementById('user-input').value;
    
    if(userInput.trim() === '') return;

    addMessageToChatbox('Sinä: ' + userInput);
    console.log(userInput);

    const response = await fetch('chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({question:userInput})
    })

    const data = await response.json();
    console.log(data.reply);
    document.getElementById('user-input').value = '';
}

function addMessageToChatbox(message, className){
    const messageElement = document.createElement('div');
    messageElement.classList.add('message',className);
    messageElement.textContent = message;
    document.getElementById('chatbox').appendChild(messageElement);

}
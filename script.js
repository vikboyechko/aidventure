
// openAI section
var el0 = $('.el0')
var el1 = $('.el1')
var el2 = $('.el2')
var el3 = $('.el3')
var q1 = $('.q1')
var q2 = $('.q2')
var q3 = $('.q3')
var a1 = $('#a1')
var a2 = $('#a2')
var a3 = $('#a3')
var inputAPI = $('#inputAPI')
var submitAPI = $('#submit-api')
var submit1 = $('#submit1')
var submit2 = $('#submit2')
var submit3 = $('#submit2')

el1.hide();
el2.hide();
el3.hide();

var okey = ""

submitAPI.on('click', function(event) {
    event.preventDefault();
    okey = inputAPI.val();
    el0.hide();
    el1.show();
    // return okey;
    chooseAdventure();
  })

function chooseAdventure() {
    submit1.on('click', function(event) {
        event.preventDefault();
        // el1.show();
        var a1Response = a1.val();
        el1.hide();
        console.log(a1Response)
        el2Function(a1Response);
      })
}



function el2Function(lastResponse) {
    console.log(lastResponse)
    var prompt = `Let's make second-person choose your own adventure story. Write a short creative story with a plot twist featuring a character who is ${lastResponse}. It should be about 50 words, and it's a second-person story so it should be about 'You'. Include paragraph breaks. End this part of the story with a question of what to do next.`;


    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + okey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo-1106',
            messages: [{role: "system", content: prompt}], 
            max_tokens: 200 
        })
    })
    .then(response => response.json())
    .then(data => {
        var gptResponse = data.choices[0].message.content.trim();
        $('.gpt-2').text(gptResponse);
        el2.show();
        q2.show();
        a2.show();
        submit2.on('click', function(event) {
          event.preventDefault();
          var a2Response = a2.val();
          el2.hide();
          el3Function(gptResponse, a2Response);
          
      });
    })
}

function el3Function(storySoFar, lastResponse) {
  console.log(storySoFar, lastResponse)
  var prompt = `Let's continue a second-person choose your own adventure story. Here is the story so far: ${storySoFar}, and the last user response: ${lastResponse} Write a creative story about what happens next. It should be about 50 words, and it's a second-person story so it should be about 'You'. Include paragraph breaks. End this part of the story with a question of what to do next.`;


    fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + okey
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo-1106',
            messages: [{role: "system", content: prompt}], 
            max_tokens: 1000 //
        })
    })
    .then(response => response.json())
    .then(data => {
        var gptResponse = data.choices[0].message.content.trim();
        console.log(gptResponse)
        $('.gpt-3').text(gptResponse);
        el3.show();
        q3.show();
        a3.show();

    })
} 

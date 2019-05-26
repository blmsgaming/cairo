// 
// STATE and VISIBILITY
//

const GameState = {
  WELCOME: 1,
  LOBBY: 2,
  BATTLE: 3,
  BLESSED: 4,
  LOST: 5,
  VICTORY: 6,
  WAIT: 7
}

const DivID = ['', 'welcome', 'lobby', 'battle', 'blessed', 'lost', 'victory', 'wait']

function setVis(id, status) {
  const el = document.getElementById(id)
  el.style.display = status ? 'block' : 'none'
}

function setState(st) {
  state.state = st
  for (let i = 1; i < DivID.length; i++) {
    if (i === st) {
      setVis(DivID[i], true)
    } else {
      setVis(DivID[i], false)
    }
  }
}

function getEl(id) {
  return document.getElementById(id)
}

let state = {
  users: [],
  state: GameState.WELCOME
}

//
// WEBSOCKETS
//

url = 'ws://b81927e3.ngrok.io'

ws = new WebSocket(url)

ws.onopen = function () {
  console.log("Opened WebSocket")
}

ws.onclose = function (e) {
  console.log("closed")
}

ws.onerror = function (e) {
  console.log("error")
}

function send(eventName, payload) {
  const merged = {
    eventName: eventName,
    user: {
      id: state.id
    },
    ...payload
  }
  ws.send(JSON.stringify(merged))
}

ws.addEventListener('message', event => {
  console.log(`Message from server: ${event.data}`)
  const data = JSON.parse(event.data)
  switch (data.eventName) {
    case 'uuid-res':
      state.id = data.id
      break
    case 'round-start':
      // Uncheck radios
      state.q = data.q
      for (let i = 0; i < 4; i++) {
        const choiceEl = document.getElementById(`choice${i}`)
        const choiceLabelEl = document.querySelector(`#choice${i} ~ label`)
        choiceLabelEl.innerHTML = state.q.choices[i]
        choiceEl.checked = false
      }
      setState(GameState.BATTLE)
      const questEl = document.getElementById('question')
      questEl.innerText = state.q.question
      console.log("Question set")
      break
    case 'round-end':
      if (data.correct) {
        setState(GameState.VICTORY)
        console.log('Answer was correct!')
      } else {
        setState(GameState.LOST)
        console.log('Wrong answer')
      }
      break
    case 'round-tick':
      const timeEl = document.getElementById('timeLeft')
      timeEl.innerText = `${data.timeLeft} milliseconds left in this round`
      break
    case 'game-start':
      setState(GameState.BATTLE)
      break
    case 'game-end':
      console.log('Game ended!')
      break
    case 'lobby-res':
      state.users = data.users
      break
    default:
      console.log(`Bad eventName: ${data.eventName}`)
  }
})

function sendUsername() {
  const username = document.getElementById('player').value
  send('user-join', { username: username })
  setState(GameState.LOBBY)
  refreshLobbyList()
}

function requestStartGame() {
  send('game-start-req', {})
}

// Grab all connected users and put in state.users
function requestLobby() {
  send('lobby-req', {})
}

function refreshLobbyList() {
  var ul = document.getElementById("playerlist");
  // Delete all li
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild)
  }

  // Append new li
  for (const user of state.users) {
    const li = document.createElement('li')
    li.appendChild(document.createTextNode(user))
    ul.appendChild(li)
  }
}

function sendAnswer(idx) {
  send('round-res', { idx: idx })
  setState(GameState.WAIT)

}

//
// GAME LOGIC
//

window.onload = event => {
  setState(GameState.WELCOME)
  //setState(GameState.BLESSED)
}

function tick() {
  if (state.state === GameState.LOBBY) {
    requestLobby()
    refreshLobbyList()
  }
}
function loadChoices(){
    
}
const ticksPerSec = 2
setInterval(tick, 1000 / ticksPerSec)
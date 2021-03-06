'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import Api from '../api'
import fs from 'fs'

const dbFolder = `${app.getPath('documents')}/assignme`
const dbPath = process.env.NODE_ENV === 'development'
  ? `${dbFolder}/db_dev.json`
  : `${dbFolder}/db.json`

// Check if the ~/Documents/assignme folder and create it if it doesn't exist
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder)
const api = new Api({ dbPath })

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 650,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/** ****************** API events*****************/

ipcMain.on('get-tasks', (event) => {
  api.getTasks().then(tasks => {
    event.sender.send('all-tasks', tasks)
  })
})

ipcMain.on('remove-task', (event, id) => {
  api.removeTask(id).then(() => {
    event.sender.send('removed-task', id)
  })
})

ipcMain.on('update-task-status', (event, { task, status }) => {
  api.updateTaskStatus({ task, status }).then(() => {
    event.sender.send('updated-task-status', { task, status })
  })
})

ipcMain.on('update-task', (event, task) => {
  api.updateTask(task).then(() => {
    event.sender.send('updated-task', task)
  })
})

ipcMain.on('create-task', (event, task) => {
  api.createTask(task).then(() => {
    event.sender.send('created-task', task)
  })
})

ipcMain.on('signin', (event, user) => {
  api.signIn(user).then(success => {
    let signal = success ? 'signed-in' : 'signin-error'
    event.sender.send(signal, success ? user : null)
  })
})

ipcMain.on('check-for-user', (event) => {
  event.sender.send('checked-for-user', api.checkForUserSync())
})

ipcMain.on('signup', (event, user) => {
  api.signUp(user).then(() => {
    event.sender.send('signed-up', user)
  })
})
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

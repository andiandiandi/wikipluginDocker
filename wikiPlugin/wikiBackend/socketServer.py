from flask import Flask, render_template, request
from flask_socketio import SocketIO
from flask import render_template
import logging

from manager import sessionManager
from manager import pathManager
# app.config['SECRET_KEY'] = 'secret!'
import json
import time
import threading
import sys
import os
import base64

app = Flask(__name__)
socketio = SocketIO(app)


def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()


@socketio.on("connect", namespace='/events')
def on_connect_events():
    print("connected to events: " + request.sid, file=sys.stderr)
    pass


@socketio.on('disconnect', namespace="/events")
def on_disconnect_events():
    print("disconnected to events", file=sys.stderr)
    sessionManager.removeSubscriber(request.sid)


@socketio.on("connect")
def on_connect():
    print("connected", file=sys.stderr)
    pass


@socketio.on('disconnect')
def on_disconnect():
    print("onDisconnectedEvent", file=sys.stderr)
    sessionManager.remove(request.sid)
    if not sessionManager.hasConnections():
        shutdown_server()


def error(message, sid):
    print("error: " + str(message), file=sys.stderr)
    socketio.emit('error', message, room=sid)


def get(sid):
    wiki = sessionManager.wiki(sid)
    if wiki:
        return wiki
    else:
        print("get: no wiki found with sid: " + sid, file=sys.stderr)
        error("you have to connect to server first", sid)
        return None


@socketio.on('initialize_project')
def on_initializeProject(root_folder):
    root_folder = pathManager.pathToPosix(root_folder)
    wiki = sessionManager.wiki(request.sid)
    if not wiki:
        success = sessionManager.register(request.sid, socketio)
        if not success:
            error("could not register wiki,socketid:", request.sid)

        #print("initialize_project: " + str(sessionManager.sids()),file=sys.stderr)
    wiki = get(request.sid)
    response = wiki.initializeProject(root_folder)
    if response["status"] == "exception":
        error("exception while init project: " +
              response["response"], request.sid)
    elif response["status"] == "success":
        socketio.emit("project_initialized",
                      "successfully initialized project", room=request.sid)
    else:
        socketio.emit("project_initialized",
                      "uninteded behaviour while init project", room=request.sid)


@socketio.on('search_query')
def on_searchQuery(jsonStr):
    wiki = get(request.sid)
    if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
        response = wiki.Indexer.runRealSearchQuery(jsonStr)
        if response["status"] == "exception":
            error(response["response"], request.sid)
        else:
            socketio.emit("search_query", json.dumps(
                response["response"]), room=request.sid)
    else:
        error("you have to initialize the database first", request.sid)


@socketio.on('saved_search_query')
def on_listSearchQuery():
    wiki = get(request.sid)
    if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
        response = wiki.Indexer.listSearchQuery()
        if response["status"] == "exception":
            error(response["response"], request.sid)
        else:
            socketio.emit("saved_search_query", json.dumps(
                response["response"]), room=request.sid)
    else:
        error("you have to initialize the database first", request.sid)


@socketio.on('clear_db')
def on_clearDB(jsonStr):
    wiki = get(request.sid)
    if wiki:
        if wiki.dbStatus == sessionManager.DbStatus.notConnected:
            realJson = json.loads(jsonStr)
            root_folder = realJson["root_folder"]
            connected = wiki.connectToDatabase(root_folder)
            if not connected:
                error("could not connect to database", request.sid)
                return

        result = wiki.Indexer.clearDatabase()
        socketio.emit("clear_db", json.dumps(result), room=request.sid)
    else:
        error("initialize project first", request.sid)


def createContainer():
    return '<div class="foldercontainer">'


def createFile(path):
    return '<span class="file fa-file-text" ' + 'data-fullpath=' + path + '>' + os.path.basename(path) + '</span>'


def createNonemptyFolder(name):
    return '<span class="folder fa-folder-o" data-isexpanded="true">' + name + '</span>'


def createEmptyFolder(name):
    return '<span class="folder fa-folder">' + name + '</span>'


def createNoItems():
    return '<span class="noitems">No Items</span>'


def generateFileHierarchyRecursive(jsondata):
    toret = ""
    for data in jsondata:
        toret += createContainer()
        files = data["files"]
        if files:
            toret += createNonemptyFolder(data["name"])
            for file in files:
                toret += createFile(file["path"])
        else:
            toret += createEmptyFolder(data["name"])
            toret += createNoItems()
        toret += generateFileHierarchyRecursive(data["folders"])
        toret += '</div>'

    return toret


def generateFullFileHierarchy(path):
    jsondata = pathManager.path_to_dict(path)
    return generateFileHierarchyRecursive([jsondata])


@app.route('/<sid>')
def fileHierarchy(sid):
    print("filehierarchy for sid: " + sid)
    wiki = get(sid)
    if wiki:
        if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
            return render_template('fileHierarchy.html',
                                   fileHierarchy=generateFullFileHierarchy,
                                   root_folder=wiki.root_folder,
                                   sid=sid)
        else:
            return "project not init"
    else:
        return "wiki not found"


def isBase64(s):
    try:
        return base64.b64encode(base64.b64decode(s)).decode("utf-8") == s
    except Exception:
        return False


def isValidFilepath(fpath):
    isFile = os.path.isfile(fpath)
    if isFile:
        return True

    isDirectory = os.path.isdir(fpath)
    if isDirectory:
        return True

    return False


@app.route('/sid/<sid>/filepath/<filepath>')
def wikipage(sid, filepath):
    print("\n" + filepath)
    print("wikipage for sid: " + sid + " with path " + filepath)
    print("\n" + filepath)
    if isBase64(filepath):
        filepath = pathManager.pathToPosix(filepath)
        filepath = base64.b64decode(filepath).decode("utf-8")
        if not isValidFilepath(filepath):
            return "filepath doesnt exist or is not a valid filepath for any os"
    else:
        return "filepath not base64 encoded"
    #print("new filepath after decode " + filepath)
    wiki = get(sid)
    if wiki:
        if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
            wikipageHtml = wiki.Indexer.wikipageHtml(filepath)
            dirpath = os.path.dirname(filepath)
            return render_template('wikipage.html',
                                   root_folder=wiki.root_folder,
                                   wikipageHtml=wikipageHtml,
                                   sid=sid,
                                   path=filepath,
                                   dirpath=dirpath)
        else:
            return "project not init"
    else:
        return "wiki not found"


@app.route('/')
def index():
    sids = sessionManager.sids()
    print("/ " + str(sids))
    return render_template('index.html', sids=sids)


@socketio.on('subscribe', namespace='/events')
def subscribeFilesChanged(data):
    print("subscribeFilesChanged with sid: " + request.sid)
    jsondata = None
    try:
        jsondata = json.loads(data)
        if jsondata and type(jsondata) == list:
            for eventItem in jsondata:
                eventname = eventItem["eventname"] if "eventname" in eventItem else None
                targetSid = eventItem["targetsid"] if "targetsid" in eventItem else None
                path = eventItem["path"] if "path" in eventItem else None
                if eventname and targetSid:
                    sessionManager.addSubscriber(
                        request.sid, targetSid, eventname, socketio, "/events", path)
    except Exception as E:
        print("EXP in subscribe:" + str(E))


@socketio.on('sel_content')
def on_selContent(jsonStr):
    wiki = get(request.sid)
    content = wiki.Indexer.selContent()
    socketio.emit("sel_content", str(content), room=request.sid)


@socketio.on('sel_files')
def on_selFiles(jsonStr):
    wiki = get(request.sid)
    content = wiki.Indexer.selFilesDEBUG()
    socketio.emit("sel_files", str(content), room=request.sid)


@socketio.on('word_count')
def on_wordCount(targetPath):
    wiki = get(request.sid)
    if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
        result = wiki.Indexer.wordCount(path=pathManager.pathToPosix(
            targetPath)) if len(targetPath) > 1 else wiki.Indexer.wordCount()
        socketio.emit("word_count", json.dumps(result), room=request.sid)
    else:
        error("you have to initialize the project first", request.sid)


@socketio.on('create_wikilink')
def on_createWikilink(jsonstr):
    try:
        d = json.loads(jsonstr)
        wiki = get(request.sid)
        if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
            if d["type"] == "toggle":
                word = d["word"]
                srcPath = pathManager.pathToPosix(d["srcPath"])
                result = wiki.Indexer.generateWikilinkData(word, srcPath)
                socketio.emit("create_wikilink", json.dumps(
                    result["response"]), room=request.sid)
            elif d["type"] == "imagelink":
                srcPath = pathManager.pathToPosix(d["srcPath"])
                result = wiki.Indexer.generateImagelinkData(srcPath)
                socketio.emit("create_wikilink", json.dumps(
                    result["response"]), room=request.sid)
            elif d["type"] == "create":
                filename = d["filename"]
                template = d["template"]
                folder = pathManager.pathToPosix(d["folder"])
                srcPath = pathManager.pathToPosix(d["srcPath"])
                result = wiki.Indexer.createWikilink(
                    template, folder, filename, srcPath)
                if result["status"] == "exception":
                    error(result["response"], request.sid)
                else:
                    socketio.emit("create_wikilink", json.dumps(
                        result["response"]), room=request.sid)
            else:
                error("corrupted data string", request.sid)

        else:
            error("you have to initialize the project first", request.sid)
    except Exception as E:
        error("Error in 'create_wikilink'-event: " +
              str(E) + " | " + type(E).__name__, request.sid)


@socketio.on('render_wikipage')
def on_renderWikipage(pathStr):
    if type(pathStr) != str:
        return

    wiki = get(request.sid)
    if wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
        pathStr = pathManager.pathToPosix(pathStr)
        file = wiki.Indexer.getFile()
        if file:
            notified = sessionManager.notifySubscribers(
                "render_wikipage", request.sid, jsondata=pathStr)
            if not notified:
                socketio.emit("open_browser", pathStr, room=request.sid)
    else:
        error("you have to initialize the project first", request.sid)


socketio.run(app, host="0.0.0.0", port=9000)

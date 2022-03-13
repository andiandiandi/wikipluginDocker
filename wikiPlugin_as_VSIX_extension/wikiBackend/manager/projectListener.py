import logging
import sys
import time
import copy
import os
import json
from threading import Thread
from threading import Lock

from collections import deque

from .libs.watchdog.events import PatternMatchingEventHandler
from .libs.watchdog.events import FileSystemEventHandler
from .libs.watchdog.observers import Observer

from . import sessionManager
from . import pathManager


class FileEventHandler(PatternMatchingEventHandler):

	def __init__(self, patterns=None, ignore_directories=False):
		super(FileEventHandler, self).__init__(
			patterns=patterns, ignore_directories=ignore_directories)
		self.historyQueue = deque()
		self.lock = Lock()

	def on_moved(self, event):
		self.accessQueue("moved", event)

	def on_created(self, event):
		self.accessQueue("created", event)

	def on_deleted(self, event):
		self.accessQueue("deleted", event)

	def on_modified(self, event):
		self.accessQueue("modified", event)

	def accessQueue(self, accessType, event=None):
		with self.lock:
			# print("accessType: " + accessType + " | historyQueue: " + str(self.historyQueue))
			if accessType == "fetch":
				dCopy = copy.deepcopy(self.historyQueue)
				self.historyQueue.clear()
				return dCopy
			elif accessType == "modified":
				self.historyQueue.append({"type": "modified",
										  "srcPath": pathManager.pathToPosix(event.src_path),
										  "valid": True})
			elif accessType == "created":
				self.historyQueue.append({"type": "created",
										  "srcPath": pathManager.pathToPosix(event.src_path),
										  "valid": True})
			elif accessType == "deleted":
				self.historyQueue.append({"type": "deleted",
										  "srcPath": pathManager.pathToPosix(event.src_path),
										  "valid": True})
			elif accessType == "moved":
				self.historyQueue.append({"type": "moved",
										  "srcPath": pathManager.pathToPosix(event.src_path),
										  "destPath": pathManager.pathToPosix(event.dest_path),
										  "valid": True
										  })

	def fetch(self):
		return self.accessQueue("fetch")


class FileSystemWatcher:

	def __init__(self, wiki):
		self.wiki = wiki
		self.shouldRun = False
		self.paused = False
		self.event_handler = FileEventHandler(
			patterns=['*' + e for e in pathManager.supportedExtensions()], ignore_directories=True)
		self.observer = Observer()

	def start(self):
		self.shouldRun = True
		thread = Thread(target=self.startObserver)
		thread.start()

	def stop(self):
		self.shouldRun = False
		self.observer.join()
		print("stopped FileSystemWatcher", file=sys.stderr)

	def pause(self):
		self.paused = True

	def resume(self):
		self.paused = False

	def isPaused(self):
		return self.paused

	def isRunning(self):
		return self.shouldRun

	def parseInsertFileEvent(self,q):
		lenOfQueue = len(q)
		idx = 0
		while idx < lenOfQueue:
			shouldIncIdx = True
			#print("idx: " + str(idx))
			entry = q[idx]
			#print("entry: " + str(entry))
			if "type" in entry and entry["type"] == "created":
				#print("in created")
				#check next 2 entries if following order: delete -> created
				if idx+2 < lenOfQueue:
					#print("idx+2")
					if q[idx+1]["type"] == "deleted" and q[idx+2]["type"] == "created":
						#then delete the 2 malicious entries
						del q[idx+1]
						del q[idx+1]
						lenOfQueue = lenOfQueue -2
				#print("q: " + str(q))
				idx = idx + 2
				shouldIncIdx = False

			if shouldIncIdx:
				idx = idx +1
			#print("end: " + str(q))
		return q

	def startObserver(self):
		print("started FileSystemWatcher")
		self.observer.schedule(
			self.event_handler, self.wiki.root_folder, recursive=True)
		self.observer.start()
		try:
			while self.shouldRun:
				time.sleep(4)
				if not self.shouldRun:
					print("watchdog break loop")
					break
				if self.isPaused():
					print("watchdog paused")
					continue
				q = self.event_handler.fetch()
				modifiedBookkeeping = {}
				if self.wiki.dbStatus == sessionManager.DbStatus.projectInitialized:
					if q:
						print("q: " + str(q))
						print("before parsing")
						q = self.parseInsertFileEvent(q)
						print("q after parsing: " + str(q))
						for d in q:
							if d["type"] == "modified" or d["type"] == "created" or d["type"] == "moved":
								d["lastmodified"] = FileSystemWatcher.readModifiedValue(
									d["srcPath"] if d["type"] != "moved" else d["destPath"])
								if d["srcPath"] in modifiedBookkeeping and modifiedBookkeeping[d["srcPath"]] == d["lastmodified"]:
									d["valid"] = False
								else:
									modifiedBookkeeping[d["srcPath"]
														] = d["lastmodified"]
								if d["type"] != "moved":
									d["content"] = pathManager.generateContent(
										d["srcPath"])
								else:
									if d["srcPath"] == d["destPath"]:
										d["valid"] = False
						modifiedBookkeeping.clear()
						dict_wrapper = {"queue": [entry for entry in q]}
						result = self.wiki.Indexer.filesChanged(dict_wrapper)
						self.wiki.send("files_changed", str(
							result) + " | " + json.dumps(dict_wrapper))
		except Exception as e:
			self.wiki.send("error", "exception in startObeserver:" +
						   str(e) + " | " + type(e).__name__)
			self.observer.stop()
			self.wiki.dbStatus = sessionManager.DbStatus.connectionEstablished
			print("error in observer: " + str(e))
		self.observer.stop()
		self.observer.join()
		print("stopped FileSystemWatcher")

	@staticmethod
	def readModifiedValue(path):
		try:
			return os.path.getmtime(path)
		except Exception as e:
			print("EXCEPTION in readmodi projectlistener:" +
				  str(e), file=sys.stderr)
			return "Excp in readModifiedValue:" + str(e)

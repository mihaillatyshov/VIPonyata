import os
from flask import current_app, request, session, jsonify, make_response
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = "C:/Coding/Web/VIPonyata/client/public"

@current_app.route('/upload', methods=['POST'])
def fileUpload():
	target=os.path.join(UPLOAD_FOLDER, 'img')
	if not os.path.isdir(target):
		os.mkdir(target)
	print("==========================================================")
	print("welcome to upload`")
	print(len(request.files))
	if (len(request.files) == 0):
		return jsonify("img/Test.png")
	file = request.files['file'] 
	filename = secure_filename(file.filename)
	destination="/".join([target, filename])
	file.save(destination)
	session['uploadFilePath']=destination
	response = "img/" + filename
	print("==========================================================")
	return jsonify(response)
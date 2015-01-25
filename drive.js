function searchFile(name, callback) {
  name = name || 'mus.json';
  gapi.client.load('drive', 'v2', function() {
    var q = gapi.client.drive.files.list({'q': 'title = \'' + name + '\''});
    q.execute(function (resp) {
      var id = (resp.items.length) ? resp.items[0].id : '';
      callback(id);
    });
  });
}

function getFile(id) {
	if (id.length) {
		printFile(id);
	} else {
		alert('insertFile');
	}
}

/**
 * Print a file's metadata.
 *
 * @param {String} fileId ID of the file to print metadata for.
 */
function printFile(fileId) {
  var request = gapi.client.drive.files.get({
      'id': fileId
  });
  request.execute(function(resp) {
    if (!resp.error) {
      console.log('Title: ' + resp.title);
      console.log('Description: ' + resp.description);
      console.log('MIME type: ' + resp.mimeType);
    } else if (resp.error.code == 401) {
      // Access token might have expired.
      checkAuth();
    } else {
      console.log('An error occured: ' + resp.error.message);
    }
  });
}

/**
 * Copy an existing file.
 *
 * @param {String} originFileId ID of the origin file to copy.
 * @param {String} copyTitle Title of the copy.
 */
function copyFile(originFileId, copyTitle) {
  var body = {'title': copyTitle};
  var request = gapi.client.drive.files.copy({
    'fileId': originFileId,
    'resource': body
  });
  request.execute(function(resp) {
    console.log('Copy ID: ' + resp.id);
  });
}


/**
 * Insert new file.
 *
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Function to call when the request is complete.
 */
function insertFile(fileData, callback) {
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var reader = new FileReader();
  reader.readAsBinaryString(fileData);
  reader.onload = function(e) {
    var contentType = fileData.type || 'application/octet-stream';
    var metadata = {
      'title': fileData.name,
      'mimeType': contentType
    };

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});
    if (!callback) {
      callback = function(file) {
        console.log(file)
      };
    }
    request.execute(callback);
  }
}

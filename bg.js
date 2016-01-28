chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  console.log(request);
	if (request.type == 'download') {
		chrome.downloads.download({
			url: request.url,
				filename: request.filename,
				saveAs: false
		});
	}
	if (request.type == 'info') {
		sendResponse({
			version: chrome.app.getDetails().version
		});
	}
  });
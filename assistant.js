
$('.m-termHead .info').append(`
	<hr/>
	<h2>公开课管理助手</h2>
	<p><b>项目地址：</b><a href="https://github.com/44670/OpenCourseAssistant">https://github.com/44670/OpenCourseAssistant</a></p>
	<p><b>版本：</b><span class="span-extension-version"></span></p>
	<input type="button" class="btn-export-currentpage" value="导出本页所有学生的作业附件">
	<br/>

`);

chrome.runtime.sendMessage({type:"info"}, function(response) {
	$('.span-extension-version').text(response.version);
});

var jobList = [];
var currentWorkingIndex = 0;
var hasLogText = false;

function log(s) {
	if (!hasLogText) {
		$('.m-termHead .info').append(`
			<textarea class="text-log" rows="10" style="width:100%; white-space:nowrap; overflow:scroll;"></textarea>
			`);
		hasLogText = true;
	}
	var domObj = $('.text-log').append((new Date()).Format('yyyy-MM-dd hh:mm:ss ') + s + '\n')[0];
	domObj.scrollTop = domObj.scrollHeight;
}

function exportCurrentPage() {
	var tbody = $('.j-pool tbody').html().split('</tr>');
	var cookie = document.cookie.split(';');
	var sessionId = '';
	for (var i in cookie) {
		var kv = cookie[i].trim().split('=');
		if (kv[0] == 'NTESSTUDYSI') {
			sessionId = kv[1];
		}
	}
	var template = `callCount=1
scriptSessionId=\${scriptSessionId}190
httpSessionId=SESSIONID
c0-scriptName=MocQuizBean
c0-methodName=getHomeworkPaperDto
c0-id=0
c0-param0=string:PARAM0
c0-param1=null:null
c0-param2=boolean:false
c0-param3=number:4
c0-param4=string:PARAM4
batchId=BATCHID`;
	jobList = [];
	currentWorkingIndex = 0;
	for (var i = 1; i < tbody.length - 1; i++) {
		var trHtml = tbody[i];
		var tr = trHtml.split('</td>');
		var hwid = trHtml.split('/hw?id=')[1].split('&')[0];
		var aid = trHtml.split('aid=')[1].split('&')[0];

		var postBody = template.replace('SESSIONID', sessionId).replace('PARAM0', hwid).replace('PARAM4', aid);
		jobList.push({
			name: tr[0].split('<td>')[1], 
			postBody: postBody,
			aid: aid
		});
	}
	$('.btn-export-currentpage').prop("disabled",true);
	handleNextExportJob();
}

function handleNextExportJob() {
	if (currentWorkingIndex >= jobList.length) {
		log("批量导出结束。");
		$('.btn-export-currentpage').prop("disabled", false);
		return;
	}
	
	var job = jobList[currentWorkingIndex];
	var data = job.postBody.replace('BATCHID', Date.now());
	currentWorkingIndex += 1;
	$.ajax({
		type: "POST",
		url: '/dwr/call/plaincall/MocQuizBean.getHomeworkPaperDto.dwr?' + Date.now(),
		data: data,
		dataType: "text", 
		contentType: "text/plain"
	}).done(function(data) {
		var url = '';
		try {
			var fileKey = data.split('.filekey="')[1].split('"')[0];
			var fileName = JSON.parse('"' +  data.split('.filename="')[1].split('"')[0] + '"');
			url = 'http://mooc.study.163.com/homework/attachment.htm?key=' + fileKey + '&aid=' + job.aid;
		} catch (e) {
			
		}

		if (url) {
			var savePath = 'homework_export/' + job.name + '_' + fileName;
			chrome.runtime.sendMessage({type:"download", url: url, filename: savePath}, function(response) {

			});
			log(job.name + ': ' + '开始下载: ' + url + '。');
		} else {
			log(job.name + ': ' + '获取附件失败（可能未提交附件）。');
		}
		setTimeout(handleNextExportJob, 1000);
	}).fail(function(jqXHR, textStatus, errorThrown) {
		log(job.name + ': ' + '打开评分页面失败。');
		setTimeout(handleNextExportJob, 1000);
	});
}

$('.btn-export-currentpage').click(function() {
	exportCurrentPage();
});

Date.prototype.Format = function(fmt) { //author: meizz 
  var o = { 
    "M+" : this.getMonth()+1,                 //月份 
    "d+" : this.getDate(),                    //日 
    "h+" : this.getHours(),                   //小时 
    "m+" : this.getMinutes(),                 //分 
    "s+" : this.getSeconds(),                 //秒 
    "q+" : Math.floor((this.getMonth()+3)/3), //季度 
    "S"  : this.getMilliseconds()             //毫秒 
  }; 
  if(/(y+)/.test(fmt)) 
    fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
  for(var k in o) 
    if(new RegExp("("+ k +")").test(fmt)) 
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
  return fmt; 
}
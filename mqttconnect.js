//*****************************************************************//
//zone of variable take
var reconnectTimeout = 2000;
var pixel_take;
var position_take;
var objet_take;
var ip_take;
var mac_take;
var presence_take;
var listobjet=[];

//variable global
var presencenew = 0;
var presenceold = 0;
var count=0;
var countold=0;
var countnew=0;
var etat = 0;
var etatold;
var listlum=[];
var listcolorchange=[];
//signal global
var disconnectmqtt=0;
var option_color;
var option_size;
var option_speed;
var option_rotation;
var option_miroir;

// Array of colors to display objects on the canvas


var colors = ["#ff4dd2", "#ff4d4d","#66ff66","#006600","#666600", "#ffff1a", "#6666ff", "#000080","#bbff33","#446600","#66e0ff","#005266"];

var labels = ["0","1", "2", "3", "4", "5", "6", "7", "8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"];
var data_in = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var data_out = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var count_in = 0;
var count_out = 0;
var count_in_light = 0;
var count_in_light = 0;
var update_counting = false;

var history_ne = [];
//Using the HiveMQ public Broker, with a random client Id
var client = new Messaging.Client(host , port, "myclientid_" + parseInt(Math.random() * 100, 10));

//*****************************************************************//

//Gets called if the websocket/mqtt connection gets disconnected for any reason
client.onConnectionLost = function (responseObject) {
	//Depending on your scenario you could implement a reconnect logic here
	//$('#status').val("connection lost: " + responseObject.errorMessage + "Try reconnect");
	//$('#stateserver').val("Disconnected");
	//document.getElementById("stateserver").innerHTML = "Disconnected";
	/*
	var c = document.getElementById("statconnection");
	var ctx = c.getContext("2d");
	ctx.beginPath();
	ctx.arc(12,12,7,0,2*Math.PI);
	ctx.fillStyle = "red";
	ctx.fill();
	*/
	if (disconnectmqtt ==0){
		setTimeout(client.connect(options), reconnectTimeout);
		client.connect(options);
	}
	else{
	}
	if (document.getElementById("buttonconnect").disabled== true) {
		document.getElementById("buttonconnect").disabled= false;
	}
	if (document.getElementById("buttondisconnect").disabled== false) {
		document.getElementById("buttondisconnect").disabled= true;
	}
};


function get(id) {
    return document.getElementById(id);
}
function draw() {
    console.time('draw');
    heat.draw();
    console.timeEnd('draw');
    frame = null;
}
//Gets called whenever you receive a message for your subscriptions
client.onMessageArrived = function (message) {
	var nbrlum = 0;
	var total=0;
	listobjet = [];
	var objecttrouve=0;
	var listNum = [];
	var day = new Date();
	var hour = 		day.getHours();
	var minute = day.getMinutes();
	var second = day.getSeconds();
	var time_now= hour+":"+minute+":"+second;

	takepresence(message);
	takeip(message);
	takemac(message);
	takeobject(message);
	var sucess = false;
	var count_in_light_new = 0;
	var count_in_light_out_new = 0;
	var luminosity =0;
	var presence = 0;
	var consumtion = 0;
	var temperature = 0;
	var sound = 0;
	[sucess,count_in_light_new,count_out_light_new,luminosity,sound,consumtion,temperature,presence]=takecount(message);
	getvalueoption();
	for ( var i = 0; i < listluminaire.length; i++ ) {
		if ( mac_take == listluminaire[i].mac ) {
			convertirmiroir(listobjet);
			convertirrotation(listobjet);
			convertirposition(listobjet,i);
			//Update liste data;
			if (update_counting){
				if (sucess){
					count_in = count_in_light_new*1 - count_in_light*1;
					count_out = count_out_light_new*1 - count_out_light*1;
					console.log(count_in_light_new);
					data_in[hour] += count_in;
					data_out[hour] += count_out;
					//Update
					count_in_light = count_in_light_new;
					count_out_light = count_out_light_new;
					updateData_10(presence,sound, luminosity, consumtion, temperature)
					if ((count_in > 0)|| (count_out > 0)){
						addData(myChart, hour);
						if (count_in > 0){
							var obj = { count : count_in , in: true , out: false, time: time_now };
							history_ne.unshift(obj);

						}
						if (count_out > 0){
							var obj = { count :count_in , in: false , out: true, time: time_now };
							history_ne.unshift(obj);
						}
						if(history_ne.length > 5){
							history_ne.splice(5, history_ne.length-5);
						}
						//Update item
						updateData_1();
					}
				}
			}

			else{
				if (sucess){
					count_in_light = count_in_light_new;
					count_out_light = count_out_light_new;
					update_counting=true;
					draw_chart('bar');		
				}
			}
			for ( var j = 0; j < listobjet.length; j++ ) {
				listobjet[j].idlum = i;
			}
			for (var k = 0;k < listcolorchange.length;k++)
			{
				if (listcolorchange[k].idlum == i){
					var removelistcolor=1;
					for ( var j = 0; j < listobjet.length; j++ ) {
						if (listcolorchange[k].idlabel == listobjet[j].idlabel){
							removelistcolor=0;
						}
					}
					if (removelistcolor==1){
						listcolorchange.splice(k, 1);
					}
				}
			}
			listlum[i]= { lum_index : Math.pow(2,i) , lum_mac : mac_take , lum_ip : ip_take , lum_presence : (presence_take*1) , lum_listob : listobjet};
		}
	}

	//verify if an object counts 2 times:
	for ( var i = 0; i < listlum.length; i++ ) {
		nbrlum = nbrlum + listlum[i].lum_index;
		total = total + listlum[i].lum_presence;
	}

	//when all luminaire sent the mqtt message => start verify
	if ( nbrlum == (Math.pow(2,listluminaire.length)-1) ) {
		gethour();
		//findsizetable (listluminaire);
		//console.log(minpositionxluminaire , maxpositionxluminaire , minpositionyluminaire, maxpositionyluminaire)
		var c = document.getElementById("canvas");
		c.height = "640";
		c.width = "640";
		//c.width = listluminaire[listluminaire.length-1].coordx * 10 + 320;
		var ctx = c.getContext("2d");
		
		// Clear display
		ctx.clearRect(0, 0, c.width, c.height);
		//ctx.fillStyle = "#DDDDDD";
		//ctx.fillRect(0,0,c.width, c.height);

		// Process through all luminaire objects
		var found =0;
		var global_object_list = new Array();
		for ( var i = 0; i < listluminaire.length; i++ ) {
			listlum[i].lum_index = 0;
			if (listlum[i].lum_listob.length !== 0){

				//find if object k count 2 times
				for ( var k=0;k<listlum[i].lum_listob.length; k++ ) {
					ctx.beginPath();
					ctx.rect(listluminaire.coordx * 10,listluminaire.coordy * 10, 320, 320);
					ctx.stroke();

					//add all elemnt of the last list
					if (i == (listluminaire.length - 1 ))
					{
						global_object_list.push(listlum[i].lum_listob[k]);
					}

					//list for find
					for ( var j = (i+1);j<listluminaire.length; j++ ) {

						// Add object to global list of objects
						global_object_list.push(listlum[i].lum_listob[k]);

						if ( findobject( listlum[i].lum_listob[k], listlum[j].lum_listob , 4 , j) )
						{
							found = found +1;
							global_object_list.pop();

							// Remove object from list if luminaire is not first
							//if ( i != 0 ) {
							//  global_object_list.pop();
							//}
						}
					}
				}
			}
		}
		var global_object_show = new Array();
		for ( var i = 0; i < global_object_list.length ; i++ ) 
		{
			if (global_object_list[i].size != 0)
			{
				//tim co bao nhieu cai trung voi cai dau
				var list_color = new Array();
				list_color.push(global_object_list[i].idlabel);
				var nbr_object=1;
				for ( var j = i+1; j < global_object_list.length ; j++ ) {
					if ((global_object_list[j].posX == global_object_list[i].posX )
						&&(global_object_list[j].posY == global_object_list[i].posY )
						&&(global_object_list[j].size == global_object_list[i].size )
						&&(global_object_list[j].size != 0))
					{
						//trung nhau => xoa 
						list_color.push(global_object_list[j].idlabel);
						nbr_object++;
						global_object_list[j].size=0;
					}
				}
				//update list
				var new_obj = { size : global_object_list[i].size, posX : global_object_list[i].posX, posY : global_object_list[i].posY , idlum : 0 , idlabel : list_color , idlabeldemande : "none" , speed :  global_object_list[i].speed , nb_object : nbr_object };
				global_object_show.push(new_obj);
				global_object_list[i].size=0;	//delete object in the old list 
			}
		}
		//draw 2 limite of 2 camera
		//		ctx.beginPath();
		//		ctx.rect(220, 0, 320, 320);
		//		ctx.stroke();

		// Display all objects in canvas
		for ( var i = 0; i < global_object_show.length; i++ ) {
			// Start new figure
			ctx.beginPath();
			if (option_size == "dynamic"){
				var size_object_affiche=global_object_show[i].size;
			}
			else
			{
				var size_object_affiche=40+(global_object_show[i].nb_object - 1)*20;
			}
			for (var k =0; k< global_object_show[i].nb_object ; k++)
			{
				var X=20*global_object_show[i].posX;
				var Y=20*global_object_show[i].posY;
				var R=size_object_affiche;
				var A_start=k*2*Math.PI/(global_object_show[i].nb_object);
				var A_end=(k+1) * 2*Math.PI/(global_object_show[i].nb_object);
				ctx.beginPath();
				ctx.arc(X, Y, R, A_start, A_end, false);
				ctx.fillStyle = take_color(global_object_show[i].idlabel[k]);
				if (global_object_show[i].nb_object > 1)
				{
					ctx.moveTo(X, Y);
					ctx.lineTo(X+R*Math.cos(A_start), Y+R*Math.sin(A_start));
					ctx.lineTo(X+R*Math.cos(A_end), Y+R*Math.sin(A_end));
				}
				ctx.fill();
			}
			// Default: 1px black border
			ctx.lineWidth=1;
			//ctx.strokeStyle = "black";
			//ctx.stroke();
			//add vitess object
			if (option_speed == "oui"){
				ctx.fillStyle = "white";
				var radius=size_object_affiche/3;
				ctx.font = radius+"px Verdana";
				//ctx.textBaseline = "top";
				ctx.fillText(global_object_list[i].speed, (20*global_object_list[i].posX - 2*radius) , (20*global_object_list[i].posY) );  
			} 
		}

		total = total -found;
		countold=countnew;
		countnew=total;
		count= Math.floor((countold + countnew)/2);
		/*
		if ( count > 1 ) {
			document.getElementById('messages').innerHTML = count + " persons";
		} else {
			document.getElementById('messages').innerHTML = count + " person";
		}
		*/
	}
};
/*****************************************************************************/
//Connect Options
var options = {
timeout: 30,
				 cleanSession: cleansession,
				 //Gets Called if the connection has sucessfully been established
				 onSuccess: function () {
					 //$('#status').val('Connected to ' + host + ':' + port);
					 //$('#stateserver').val("Connected");
					 /*
					 document.getElementById("stateserver").innerHTML = "Connected";
					 var c = document.getElementById("statconnection");
					 var ctx = c.getContext("2d");
					 ctx.beginPath();
					 ctx.arc(12,12,7,0,2*Math.PI);
					 ctx.fillStyle = "green";
					 ctx.fill();
					 */
					 client.subscribe(topic, {qos: 2});
					 document.getElementById("canvas").style.display="table";
					 if (document.getElementById("buttondisconnect").disabled== true) {
						 document.getElementById("buttondisconnect").disabled = false;
					 }
					 if (document.getElementById("buttonconnect").disabled== false) {
						 document.getElementById("buttonconnect").disabled = true;
					 }	
				 },
				 //Gets Called if the connection could not be established
				onFailure: function (message) {
						 //$('#status').val("Connection failed: " + message.errorMessage );
						 //$('#stateserver').val("connection failed, pls try again");
						 /*
						 document.getElementById("stateserver").innerHTML = "Connection failed, pls try again";
						 var c = document.getElementById("statconnection");
						 var ctx = c.getContext("2d");
						 ctx.beginPath();
						 ctx.arc(12,12,7,0,2*Math.PI);
						 ctx.fillStyle = "red";
						 ctx.fill();
						 */
						 document.getElementById("buttonconnect").disabled= true;
					 }
};

//Creates a new Messaging.Message Object and sends it to the HiveMQ MQTT Broker
var publish = function (payload, topic, qos) {
	//Send your message (also possible to serialize it as JSON or protobuf or just use a string, no limitations)
	var message = new Messaging.Message(payload);
	message.destinationName = topic;
	message.qos = qos;
	client.send(message);
}

/*********************************************************************/
function adddetaille() {
	var row_mac = document.getElementById("rowmac");
	var i;
	for (i =0; i<listlum.length ; i++)
	{
		var x = row_mac.insertCell(0);
		x.innerHTML = listlum[i].lum_mac;
	}
}
/*********************************************************************/
function ifexistelement(objectcolor, listobjectcolor){
	for (var i=0; i<listobjectcolor.length ; i++)
	{
		if ((objectcolor.idlum == listobjectcolor[i].idlum)
				&&(objectcolor.idlabel == listobjectcolor[i].idlabel) 
				&& (objectcolor.idlabeldemande == listobjectcolor[i].idlabeldemande) )
		{
			return true;
		}

	}
	return false;
}
/*********************************************************************/
function findobject (objecttofind, listtofind, delta, indexlist){
	objecttrouve =0;
	if (listtofind.length == 0) {
		objecttrouve = 0;
		return false;
	}
	else 
	{
		var i;
		for (i=0; i< listtofind.length ; i++){
			if (((listtofind[i].posX - objecttofind.posX) < delta)
					&&((objecttofind.posX - listtofind[i].posX) < delta)
					&& ((listtofind[i].posY -objecttofind.posY) < delta)
					&& ((objecttofind.posY - listtofind[i].posY) < delta))
			{
				//update same color for same person;
				if (objecttofind.idlabeldemande =="none")
				{
					listtofind[i].idlabeldemande = objecttofind.idlabel;
					var colorchange={ idlum : indexlist , idlabel : listtofind[i].idlabel , idlabeldemande : objecttofind.idlabel };
				}
				else
				{
					listtofind[i].idlabeldemande = objecttofind.idlabeldemande;
					var colorchange={ idlum : i , idlabel : listtofind[i].idlabel , idlabeldemande : objecttofind.idlabeldemande };
				}
				if (!(ifexistelement(colorchange,listcolorchange)))
				{
					listcolorchange.push(colorchange);
				}
				objecttrouve =1;
				return true;
			}

		}
		return false;
	}
};
/*********************************************************************/
function convertirmiroir (listobject_input){
	var i;
	for ( i =0; i<listobject_input.length; i++){
		if (option_miroir == "vertical"){	
			listobject_input[i].posX = 31- listobject_input[i].posX;
		}
		if (option_miroir == "horizontal"){	
			listobject_input[i].posY = 31- listobject_input[i].posY;
		}
	}
};
/*********************************************************************/
function convertirrotation(listobject_input){
	var i;
	for ( i =0; i<listobject_input.length; i++){
		//console.log(listobject_input[i].posX);
		//console.log(listobject_input[i].posY);
		if (option_rotation == "90"){
			//console.log(option_rotation);
			var temp = listobject_input[i].posX;
			listobject_input[i].posX = 31- listobject_input[i].posY;
			listobject_input[i].posY = temp;
		}
		else if (option_rotation == "180"){	
			//console.log(option_rotation);
			listobject_input[i].posX = 31-  listobject_input[i].posX;
			listobject_input[i].posY = 31 - listobject_input[i].posY;
		}
		else if (option_rotation == "270"){	
			//console.log(option_rotation);
			var temp = listobject_input[i].posX;
			listobject_input[i].posX = listobject_input[i].posY;
			listobject_input[i].posY = 31 - temp;
		}
		//console.log(listobject_input[i].posX);
		//console.log(listobject_input[i].posY);
	}
};
/*********************************************************************/
function convertirposition (listobject_input, indexluminaire){
	var i;
	var coordxmiroir=listluminaire[indexluminaire].coordx;
	var coordymiroir=listluminaire[indexluminaire].coordy;
	for ( i =0; i<listobject_input.length; i++){
		if (option_miroir == "vertical"){	
			var coordxmiroir = - listluminaire[indexluminaire].coordx;
		}
		if (option_miroir == "horizontal"){	
			var coordymiroir = - listluminaire[indexluminaire].coordy;
		}
		listobject_input[i].posX = listobject_input[i].posX + coordxmiroir;
		listobject_input[i].posY = listobject_input[i].posY + coordymiroir;	
	}
};
/*********************************************************************/
/*function verify_color_change(object , listcolor){
	for(var i=0; i<listcolor.length; i++){
		if ((object.idlum == listcolor[i].idlum)
				&& (object.idlabel == listcolor[i].idlabel))
		{
			object.idlabeldemande = listcolor[i].idlabeldemande;
		}
	}
}*/
/*********************************************************************/
function take_color(objet_takecolor){
	var color_take;
	switch(objet_takecolor) {
		case "1":
			color_take=colors[1];
			break;
		case "2":
			color_take=colors[2];
			break;
		case "3":
			color_take=colors[3];
			break;
		case "4":
			color_take=colors[4];
			break;
		case "5":
			color_take=colors[5];
			break;
		case "6":
			color_take=colors[6];
			break;
		case "7":
			color_take=colors[7];
			break;
		case "8":
			color_take=colors[8];
			break;
		case "9":
			color_take=colors[9];
			break;
		case "10":
			color_take=colors[10];
			break;
		default:
			color_take=colors[11];
			break;
		}
	return color_take;
};
/*********************************************************************/
//function take object	
function getvalueoption(){
	option_rotation = document.getElementById("Rotation").value;
	option_size = document.getElementById("Size").value;
	option_speed = document.getElementById("Speed").value;
	option_miroir = document.getElementById("Mirroir").value;
};
/*********************************************************************/
//function take object	
function takeobject(message) {
	var payload = message.payloadString;
	//console.log(payload);
	//take object
	var objet = payload.indexOf("tobject");
	if (objet != -1){
		var objetstart = objet + 9;
		var objetend = payload.indexOf("]", objetstart);
		var objetlength = objetend - objetstart; 
		if ( objetlength > 10 )
		{
			objet_take = payload.substr( objetstart , objetlength );
			var objettmp= payload.substr( objetstart , objetlength );
			var objet_array= objettmp.split("},{");
			var i;
			// Object:{ id, size, posX, posY, speed, create, timeactive, now label, alert }
			for ( i = 0; i < objet_array.length; i++ ){
				var objet_uni= objet_array[i].split(",");
				var speedobject=(objet_uni[4].split(":"))[1]*1;
				var time_live  =(objet_uni[5].split(":"))[1]*1;
				var etatspeed;
				if ((time_live) < 10)
				{
					etatspeed="marche"
				}
				else
				{
					if (speedobject > 20){
						if (speedobject > 80)
						{
							etatspeed="courir"
						}
						else 
						{
							etatspeed="marche"
						}		
					}
					else 
					{
						etatspeed="immobile"
					}
				}
				var obj = { size : ((objet_uni[1].split(":"))[1]*1), posX : ((objet_uni[2].split(":"))[1]*1), posY : ((objet_uni[3].split(":"))[1]*1) , idlum : 0 , idlabel : (objet_uni[0].split(":"))[1] , idlabeldemande : "none" , speed :  etatspeed};
				listobjet.push(obj);
			}
		}
/*
		for (var i = 0 ; i <  listobjet.length ; i++){
        	heat.add([listobjet[i].posX*10, listobjet[i].posY*10, 30,30]);
	    }
	    heat.updateData();
	    frame = frame || window.requestAnimationFrame(draw);
	    */
	}
};
/*********************************************************************/
//function take mac	
function takemac(message) {
	var payload = message.payloadString;
	//take mac
	var macposition = payload.indexOf("mac");
	if (macposition != -1){
		var macstart = macposition + 6;
		var macend = payload.indexOf(",", macstart);
		var maclength = macend - macstart - 1;		
		mac_take = payload.substr( macstart , maclength );
	}
	else {
		mac_take = "mac not found";
	}
};
/*********************************************************************/
//function take count	
function takecount(message) {
	var payload = message.payloadString;
	//take mac

	payload.replace(/.$/,"}");
	//kiểm tra có valide json không => nếu đúng lấy data đó => xong return lại kết quả
	try {

		var json = JSON.parse(payload);
		var json_count_in  		= json.luminaire.sensors.move_in;
		var json_count_out   	= json.luminaire.sensors.move_out;
		var json_luminosity		= json.luminaire.sensors.luminosity;
		var json_sound			= json.luminaire.sensors.sound_level;
		var json_consumption	= json.luminaire.sensors.consumption;
		var json_temperature    = json.luminaire.sensors.temperature;
		var json_presence		= json.luminaire.sensors.presence;
		var result = true;
	} catch (e) {
		var result = false;
	}
	return [result,json_count_in,json_count_out,json_luminosity,json_sound,json_consumption,json_temperature,json_presence];
};
/*********************************************************************/
//function take ip
function takeip(message) {
	var payload = message.payloadString;
	//take position
	var ipposition = payload.indexOf("ip");
	if (ipposition != -1){
		var ipstart = ipposition + 5;
		var ipend = payload.indexOf(",", ipstart);
		var iplength = ipend - ipstart - 1;		
		ip_take = payload.substr( ipstart , iplength );
	}
	else {
		ip_take = payload;
	}
};
/*********************************************************************/
//function take presence
function takepresence(message) {
	var payload = message.payloadString;
	//take position
	var presenceposition = payload.indexOf("presence");
	if (presenceposition != -1){
		var presencestart = presenceposition + 10;
		var presenceend = payload.indexOf(",", presencestart);
		var presencelength = presenceend - presencestart;		
		presence_take = payload.substr( presencestart , presencelength );
	}
	else {
		presence_take = "presence not found";
	}
};
/*********************************************************************/
function gethour() {
	var today = new Date();
	//document.getElementById('time').innerHTML=today;
}
/*********************************************************************/
function send_infologin(){
	options.userName= "";
	options.password= "";
	client.connect(options);
}
/*********************************************************************/
//$(document).ready(function() {
document.addEventListener("DOMContentLoaded", function(){
		//document.getElementById("tableoption").style.display="none";
		//document.getElementById("canvas").style.display="none";
		document.getElementById("buttondisconnect").disabled= true;
		document.getElementById("buttonconnect").disabled= false;
		//$("#buttonconnect").click(function()
		document.getElementById("buttonconnect").addEventListener("click", function()
		{
			disconnectmqtt =0;
			send_infologin();
		});
		//$("#buttondisconnect").click(function()
		document.getElementById("buttondisconnect").addEventListener("click",function()
		{
			disconnectmqtt =1;
			client.disconnect();
		});
});


var myChart;
function draw_chart(type){
    var ctx = document.getElementById("myChart").getContext('2d');
    myChart = new Chart(ctx, {
    type: type,
    data: {
        labels: ["0","1", "2", "3", "4", "5", "6", "7", "8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23"],
        datasets: [{
            label: 'Person In',
            data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            backgroundColor:'rgba(255, 99, 132, 0.2)',
            borderColor:'rgba(255,99,132,1)',
            borderWidth: 1
        },
        {
            label: 'Person Out',
            data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            backgroundColor:'rgba(0, 99, 132, 0.2)',
            borderColor:'rgba(0,99,132,1)',
            borderWidth: 1
        }
        ]
    },
    options: {
        title: {
            display: false,
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        }
    }
  });
}

function addData(chart,time) {
    chart.data.datasets[0].data[time] = data_in[time]
    chart.data.datasets[1].data[time] = data_out[time]
    chart.update();
}

function updateData_10(presence,sound, luminosity, power, temperature){
	document.getElementById("person").innerHTML = presence;
	document.getElementById("sound").innerHTML = (sound/10).toFixed(2);;
	document.getElementById("luminosity").innerHTML = luminosity.toFixed(2);
	document.getElementById("power").innerHTML = (power *300).toFixed(2);
	document.getElementById("temperature").innerHTML = (temperature - 5).toFixed(2);;
}
function updateData_1(){
	var texte = '<ul class="myList-class">';
	for (var i = 0 ; i < history_ne.length ; i++){
		if (history_ne[i].in){
			texte +='<li>'+ "At " + history_ne[i].time +' , ' + history_ne[i].count + " person go in " + '</li>';
		}
		else
		{
			texte +='<li>'+ "At " + history_ne[i].time +' , ' + history_ne[i].count + " person go out " + '</li>';
		}
	}
	texte+='</ul>';
	document.getElementById("myList").innerHTML = texte;
}	
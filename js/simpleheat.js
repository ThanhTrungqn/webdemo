'use strict';

if (typeof module !== 'undefined') module.exports = simpleheat;

function simpleheat(canvas) {
    if (!(this instanceof simpleheat)) return new simpleheat(canvas);
    this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;
    this._ctx = canvas.getContext('2d');
    this._width = canvas.width;
    this._height = canvas.height;
    this._max = 1;
    this._data = [];
}

simpleheat.prototype = {

    defaultRadius: 40,

    defaultGradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    },

    data: function (data) {
        this._data = data;
        return this;
    },

    max: function (max) {
        this._max = max;
        return this;
    },

    add: function (point) {
        this._data.push(point);
        return this;
    },

    clear: function () {
        this._data = [];
        return this;
    },

    radius: function (r, blur) {
        blur = blur === undefined ? 50 : blur;

        // create a grayscale blurred circle image that we'll use for drawing points
        var circle = this._circle = this._createCanvas(),
            ctx = circle.getContext('2d'),
            r2 = this._r = r + blur;

        circle.width = circle.height = r2 * 2;

        ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
        ctx.shadowBlur = blur;
        ctx.shadowColor = 'black';

        ctx.beginPath();
        ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();

        return this;
    },

    resize: function () {
        this._width = this._canvas.width;
        this._height = this._canvas.height;
    },

    gradient: function (grad) {
        // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
        var canvas = this._createCanvas(),
            ctx = canvas.getContext('2d'),
            gradient = ctx.createLinearGradient(0, 0, 0, 256);

        canvas.width = 1;
        canvas.height = 256;

        for (var i in grad) {
            gradient.addColorStop(+i, grad[i]);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1, 256);

        this._grad = ctx.getImageData(0, 0, 1, 256).data;

        return this;
    },

    draw: function (minOpacity) {
        if (!this._circle) this.radius(this.defaultRadius);
        if (!this._grad) this.gradient(this.defaultGradient);

        var ctx = this._ctx;

        ctx.clearRect(0, 0, this._width, this._height);

        // draw a grayscale heatmap by putting a blurred circle at each data point
        for (var i = 0, len = this._data.length, p; i < len; i++) {
            p = this._data[i];
            ctx.globalAlpha = Math.min(Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity), 1);
            ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
        }

        // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
        var colored = ctx.getImageData(0, 0, this._width, this._height);
        this._colorize(colored.data, this._grad);
        ctx.putImageData(colored, 0, 0);

        return this;
    },

    updateData: function (){
        var leng =  this._data.length;
        for (var i =  0; i  < leng ; i++){
            if(this._data[i][2] > 1)
            {
                this._data[i][2] -=1;
            }
            else{
                this._data[i][2]  =0;
            }

            if(this._data[i][3] > 1)
            {
                this._data[i][3] -=1;
            }
            else
            {
                this._data.splice(i,i+1);
                i--;
                leng--;
            }
        }
    },

    _colorize: function (pixels, gradient) {
        for (var i = 0, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i + 3] * 4; // get gradient color from opacity value

            if (j) {
                pixels[i] = gradient[j];
                pixels[i + 1] = gradient[j + 1];
                pixels[i + 2] = gradient[j + 2];
            }
        }
    },

    _createCanvas: function () {
        if (typeof document !== 'undefined') {
            return document.createElement('canvas');
        } else {
            // create a new canvas instance in node.js
            // the canvas class needs to have a default constructor without any parameter
            return new this._canvas.constructor();
        }
    }
};
































/*
















function init_dataParser(listConfigLuminaire){
    var obSensors = { mac : 0, ip : 0, luminosity : 0, sound : 0, consumption : 0 , temperature : 0, presence :0};
    for (var i = 0; i < listConfigLuminaire.length ; i++){
        listLabelling[i] =[];
        listsensors[i]=obSensors;
    }
}

function dataParser(message, listConfigLuminaire){
    var mac, id ,ip , presence, listLabel , result;
    var luminosity, sound, consumption , temperature, presence;
    var list_new;
    var resultProcess;
    var listLabelFinalTracking = [];
    //Step 1: get data
    [result , mac , id ,ip ,presence, listLabel, 
        luminosity, sound, consumption , temperature, presence] = parseJson(message, listConfigLuminaire);
    if (result && (id >= 0))    //Data Valide => go to update id
    {
        listsensors[id] = dataSensors(mac,ip,luminosity,sound,consumption,temperature,presence);
        [ result, listLabelling[id] ] = dataConvert( listLabel, id , listConfigLuminaire);  //update data 
        listLabelFinalTracking = Labeling(listLabelling);
        resultProcess = true;
    } 
    else{
        resultProcess = false;
    }
    return [resultProcess, listLabelFinalTracking, listLabelling, listsensors];
}

function Labeling(listLabelling) {
    var listLabelFinal = [];
    for (var i = 0; i < listLabelling.length ; i++) {
        for (var j = 0; j < listLabelling[i].length ; j++) {
            var exist =  false;
            for (var k = 0; k < listLabelFinal.length ; k++) {
                if ( checkDoubleLabel (listLabelling[i][j] , listLabelFinal[k]))
                {
                    exist = true;
                    listLabelFinal[k] = updateLabel(listLabelling[i][j] , listLabelFinal[k]);
                    break;
                }
            }
            if (exist == false)
            {
                listLabelFinal.push(listLabelling[i][j]);
            }
        }
    }
    return listLabelFinal;
}
/*
function parseJson (message , listConfigLuminaire){
    var listobjet = [];
    var idLuminaire = -1;
    message.replace(/.$/,"}");
    //kiểm tra có valide json không
    //nếu đúng //lây Mac , Ip , presence, list_object;
    try {
        var json = JSON.parse(message);
        var json_mac = json.luminaire.mac;
        for ( var i = 0 ; i < listConfigLuminaire.length ; i++)
        {
            if (listConfigLuminaire[i].mac == json_mac ){
                idLuminaire = i;
                break;
            }
        }
        var json_ip             = json.luminaire.ip;
        var json_presence       = json.luminaire.sensors.presence;
        var json_tlabel         = json.luminaire.sensors.tLabel;
        var json_luminosity     = json.luminaire.sensors.luminosity;
        var json_sound          = json.luminaire.sensors.sound_level;
        var json_consumption    = json.luminaire.sensors.consumption;
        var json_temperature    = json.luminaire.sensors.temperature;
        var json_presence       = json.luminaire.sensors.presence;
        var result = true;
        return [result, json_mac, idLuminaire, json_ip, json_presence, json_tlabel , json_luminosity,json_sound,json_consumption,json_temperature,json_presence];
    } catch (e) {
        var result = false;
        return [result, json_mac, idLuminaire, json_ip, json_presence, json_tlabel , json_luminosity,json_sound,json_consumption,json_temperature,json_presence];
    }
}

function dataSensors ( json_mac, json_ip, json_luminosity, json_sound, json_consumption , json_temperature, json_presence){
    var obLabel = { mac : "\""+json_mac+"\"",ip : json_ip, luminosity : json_luminosity, sound : json_sound, consumption : json_consumption , temperature : json_temperature, presence :json_presence};
    return obLabel;
}

function dataConvert ( listLabel , idLuminaire , listConfigLuminaire) {
    var new_listLabel=[];
    if ( idLuminaire >= 0)
    {
        var lumPosX = listConfigLuminaire[idLuminaire].PosX;
        var lumPosY = listConfigLuminaire[idLuminaire].PosY;
        for ( var i = 0 ; i < listLabel.length ; i++)
        {
            if ( (((listLabel[i].t+listLabel[i].b) >= 4 )||(listLabel[i].size >= 25))
                && (((listLabel[i].t+listLabel[i].b) <= 58 )||(listLabel[i].size >= 25))
                && (((listLabel[i].r+listLabel[i].l) >= 4 ) ||(listLabel[i].size >= 25))
                && (((listLabel[i].r+listLabel[i].l) <= 58 ) ||(listLabel[i].size >= 25)))
            {
                var s = listLabel[i].size;
                var t = listLabel[i].t + lumPosY;
                var b = listLabel[i].b + lumPosY;
                var l = listLabel[i].l + lumPosX;
                var r = listLabel[i].r + lumPosX;

                var tBord = false, bBord = false, lBord = false, rBord = false;
                var sizegrandir = 6;
                if (s <=10 )
                {
                    sizegrandir = 8;
                }
                if ( listLabel[i].t <= BORDSIZE )
                {
                    tBord = true;
                    if (s <=20)
                    {
                        if (t >=sizegrandir){
                            t -=sizegrandir;
                        }
                        else
                        {   
                            t = 0;
                        }
                    }
                }
                if ( listLabel[i].b >= (IMAGEHEIGHT - BORDSIZE))
                {
                    bBord = true;
                    if (s <=20)
                    {
                        b +=sizegrandir;
                    }
                }
                if ( listLabel[i].l <= BORDSIZE)
                {
                    lBord = true;
                    if (s <=20)
                    {
                        if (l >=sizegrandir){
                            l -=sizegrandir;
                        }
                        else
                        {
                            l = 0;
                        }
                    }
                }
                if ( listLabel[i].r >= (IMAGEHEIGHT - BORDSIZE))
                {
                    rBord = true;
                    if (s <=20)
                    {
                        r +=sizegrandir;
                    }
                }
                var x = Math.round((l + r)/2);
                var y = Math.round((t + b)/2);
                //if ( INIT_ZONE_ACTIVE_MATRIX [ y * INIT_MATRIX_WIDTH + x ] == (idLuminaire+1) )
                if (true)
                {
                    var id = [idLuminaire];
                    var obLabel = { idLum : id, S : s, X : x, Y : y, T : t, B :b, L :l, R : r, 
                        TOPBORD : tBord, BOTTOMBORD : bBord, LEFTBORD : lBord, RIGHTBORD : rBord , updated : false , tUpdated : false};
                    new_listLabel.push(obLabel);
                }
            }
        }
        return [ true , new_listLabel];
    }
    else
    {
        return [ false , new_listLabel];
    }
}
/**************************************************************************/
/*
function Labeling(listLabelling) {
    var listLabelFinal = [];
    for (var i = 0; i < listLabelling.length ; i++) {
        for (var j = 0; j < listLabelling[i].length ; j++) {
            var exist =  false;
            for (var k = 0; k < listLabelFinal.length ; k++) {
                if ( checkDoubleLabel (listLabelling[i][j] , listLabelFinal[k]))
                {
                    exist = true;   //found => update Label và thoát khoải chương trình
                    listLabelFinal[k] = updateLabel(listLabelling[i][j] , listLabelFinal[k]);
                    break;
                }
            }
            if (exist == false)
            {
                //listLabelFinal[listLabelFinal.length] = listLabelling[i][j];
                listLabelFinal.push(listLabelling[i][j]);
            }
        }
    }
    return listLabelFinal;
}

/***************************************************************/
/*
//this function willl return true if this Label existe
function checkDoubleLabel ( tLabel1 , tLabel2 ) {
    //check if 2 label normal ou 1 label petit
    var difX = tLabel1.X - tLabel2.X;
    var difY = tLabel1.Y - tLabel2.Y;
    var height=3;
    var width=3;
    if (difX < 0){
        difX = -difX;
    }
    if (difY < 0){
        difY = -difY;
    }
    if (( difX <= width ) && ( difY <= height))
    {
        return true;
    }
    else if ( difY <= height)
    {
        if ((tLabel1.LEFTBORD && tLabel2.RIGHTBORD) 
            ||(tLabel1.RIGHTBORD && tLabel2.LEFTBORD))
        {
            return true;
        }
    }
    else if ( difX <= width )
    {
        if ((tLabel1.TOPBORD && tLabel2.BOTTOMBORD) 
            ||(tLabel1.BOTTOMBORD && tLabel2.TOPBORD))
        {
            return true;
        }
    }
    return false;
}
/******************************************************************/
/*
//this function update 2 label
function checkDoubleBordLabel ( tLabel1 , listLabel ){
    //neu nhu size nho, va gan 1 cai bord nao do
    //=> check trong list luminaire ben kia
    //verify if BordLabel
    if  (tLabel1.S < 20)
    { 
        if ( tLabel1.BOTTOMBORD || tLabel1.TOPBORD || tLabel1.LEFTBORD || tLabel1.RIGHTBORD )
        {
            for (var i =0 ; i < listLabel.length ; i ++ )
            {
                if (tLabel1.BOTTOMBORD)
                {

                }
                if (tLabel1.TOPBORD)
                {

                }
                if (tLabel1.LEFTBORD)
                {

                }
                if (tLabel1.RIGHTBORD)
                {

                }

            }
        }
    }
    return false;
}

function updateLabel ( tLabel1 , tLabel2 ) {
    var s = max (tLabel1.S ,tLabel2.S);
    var t = min (tLabel1.T ,tLabel2.T);
    var b = max (tLabel1.B ,tLabel2.B);
    var l = min (tLabel1.L ,tLabel2.L);
    var r = max (tLabel1.R ,tLabel2.R);
    //here update function deteriner bord
    //reupdate top bottom left right if object near bord
    var tBord = false, bBord = false, lBord = false, rBord = false;
    var id1 = tLabel1.idLum;
    var id2 = tLabel2.idLum;
    var idLuminaire = id1.concat(id2);
    var x = (l + r)/2;
    var y = (t + b)/2;
    var obLabel = { idLum : idLuminaire, S : s, X : x, Y : y, T : t, B :b, L :l, R : r, 
                    TOPBORD : tBord, BOTTOMBORD : bBord, LEFTBORD : lBord, RIGHTBORD : rBord , updated : false, tUpdated : false};
    return obLabel;
}

*/
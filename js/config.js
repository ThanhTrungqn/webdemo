// Configuration files
host = '192.168.0.111';
//host = '192.168.1.37';
port = 9001;
topic = 'oyalight/#';		// topic to subscribe to
cleansession = true;
var listluminaire = [
	{mac : "06:05:05:01:09:02" , room : 1 , coordx : 0  , coordy : 0  , rotation : 0},
	//{mac : "06:05:05:01:09:03" , room : 1 , coordx : 0  , coordy : 10  , rotation : 0},
];

/*
var minpositionxluminaire=0;
var maxpositionxluminaire=0;
var minpositionyluminaire=0;
var maxpositionyluminaire=0;

function findsizetable (listluminaire){
  var i;
  minpositionxluminaire=0;
  maxpositionxluminaire=0;
  minpositionyluminaire=0;
  maxpositionyluminaire=0;
  for ( i =0; i<listluminaire.length; i++){
	if (minpositionxluminaire > listluminaire[i].coordx ){
		minpositionxluminaire=listluminaire.coordx ;
	}
	if (minpositionyluminaire > listluminaire[i].coordy ){
		minpositionyluminaire=listluminaire[i].coordy;
	}
	if (maxpositionxluminaire < listluminaire[i].coordx ){
		maxpositionxluminaire=listluminaire[i].coordx;
	}
	if (maxpositionyluminaire < listluminaire[i].coordy ){
		maxpositionyluminaire=listluminaire[i].coordy;
	}
  }
};
*/
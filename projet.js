"use strict"

// SHADER 3D MINIMUM

//Shader pour creer les orbites des différents elements/planetes
var circle_vert=`#version 300 es
uniform mat4 circleMatrix;
uniform int nb;

void main()
{
	gl_PointSize = 0.8;
	float a = 6.2832*float(gl_VertexID)/float(nb);
	gl_Position = circleMatrix * vec4(sin(a),cos(a),0,1);
}
`;

var color_frag=`#version 300 es
precision highp float;
out vec4 frag_out;
void main()
{
	frag_out = vec4(1,1,1,1);
}
`;

//shader pour creer les elements/planetes
var white_vert=`#version 300 es
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;

in vec2 texcoord_in;
in vec3 position_in;
out vec2 TC0;
out vec2 TC1;

void main()
{
	//basculer horizontalement les textures
	TC0 = vec2(texcoord_in.x, 1.0 - texcoord_in.y);
	TC1 = vec2(texcoord_in.x, 1.0 - texcoord_in.y);
	gl_Position = projectionMatrix * viewMatrix * vec4(position_in,1);
}`;

var white_frag=`#version 300 es
precision highp float;
uniform sampler2D TU0;
uniform sampler2D TU1;
//permet de savoir si une deuxieme texture doit etre applique
uniform int b;
//valeur de decalage de la texture de ciel
uniform float decalage;

in vec2 TC0;
in vec2 TC1;
out vec4 frag_out;

void main()
{
	if(b == 1) {
		vec2 texture_move = vec2(mod(TC1.x+decalage, 1.0),TC1.y);
		vec4 sol = texture(TU0,TC0).rgba;
		vec4 ciel = texture(TU1,texture_move).rgba;

		frag_out = vec4(mix(sol,ciel,ciel.r));

	} else {
		vec4 color = texture(TU0,TC0).rgba;
		frag_out = color;
	}
}`;

let prg_white = null;
var prg_circ = null;

let espace_rend = null;
let espace_tex = null;

let soleil_rend = null;
let soleil_tex = null;

let table_donnee = new Array();

let pos_orbit = null;
let planete = null;

var sl_speed = null;
var sl_distance = null;
var vao1 = null;
function init_wgl()
{
	prg_white = ShaderProgram(white_vert,white_frag,'white');
	prg_circ = ShaderProgram(circle_vert,color_frag,'Circle');

	UserInterface.begin(); // name of html id
	sl_speed = UserInterface.add_slider("Acceleration",1,1000,0, update_wgl);
	sl_distance = UserInterface.add_slider("Exageration",65,500,0, update_wgl);
	UserInterface.use_field_set('V',"Orbites");
	UserInterface.add_label("+ ou - pour naviguer entre les orbites");
	UserInterface.add_label("espace pour revenir à l'état initial");
	UserInterface.add_label("p pour basculer entre les planetes et les orbites");
	UserInterface.adjust_width();

	pos_orbit = -1;
	planete = -1;

	table_donnee[0] = new Array();
	table_donnee[0][0] = 12;
	table_donnee[0][1] = 4879;
	table_donnee[0][2] = 88;
	table_donnee[0][3] = 59;
	table_donnee[0][4] = Texture2d();
	table_donnee[0][4].load("textures/mercury.jpg");
	table_donnee[0][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[1] = new Array();
	table_donnee[1][0] = 15;
	table_donnee[1][1] = 12104;
	table_donnee[1][2] = 225;
	table_donnee[1][3] = 243;
	table_donnee[1][4] = Texture2d();
	table_donnee[1][4].load("textures/venus_surface.jpg");
	table_donnee[1][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[2] = new Array();
	table_donnee[2][0] = 19;
	table_donnee[2][1] = 12756;
	table_donnee[2][2] = 365;
	table_donnee[2][3] = 1;
	table_donnee[2][4] = Texture2d();
	table_donnee[2][4].load("textures/earth_daymap.jpg");
	table_donnee[2][5] = (Mesh.Sphere(100)).renderer(true,true,true);
	table_donnee[2][6] = Texture2d();
	table_donnee[2][6].load("textures/earth_clouds.jpg");

	table_donnee[3] = new Array();
	table_donnee[3][0] = 26;
	table_donnee[3][1] = 6792;
	table_donnee[3][2] = 720;
	table_donnee[3][3] = 1;
	table_donnee[3][4] = Texture2d();
	table_donnee[3][4].load("textures/mars.jpg");
	table_donnee[3][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[4] = new Array();
	table_donnee[4][0] = 1;
	table_donnee[4][1] = 3476;
	table_donnee[4][2] = 27;
	table_donnee[4][3] = 27;
	table_donnee[4][4] = Texture2d();
	table_donnee[4][4].load("textures/moon.jpg");
	table_donnee[4][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[5] = new Array();
	table_donnee[5][0] = 38;
	table_donnee[5][1] = 142984;
	table_donnee[5][2] = 4380;
	table_donnee[5][3] = (10/24);
	table_donnee[5][4] = Texture2d();
	table_donnee[5][4].load("textures/jupiter.jpg");
	table_donnee[5][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[6] = new Array();
	table_donnee[6][0] = 52;
	table_donnee[6][1] = 120536;
	table_donnee[6][2] = 10585;
	table_donnee[6][3] = (11/24);
	table_donnee[6][4] = Texture2d();
	table_donnee[6][4].load("textures/saturn.jpg");
	table_donnee[6][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[7] = new Array();
	table_donnee[7][0] = 84;
	table_donnee[7][1] = 51118;
	table_donnee[7][2] = 30660;
	table_donnee[7][3] = (17/24);
	table_donnee[7][4] = Texture2d();
	table_donnee[7][4].load("textures/uranus.jpg");
	table_donnee[7][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	table_donnee[8] = new Array();
	table_donnee[8][0] = 100;
	table_donnee[8][1] = 49528;
	table_donnee[8][2] = 60225;
	table_donnee[8][3] = (16/24);
	table_donnee[8][4] = Texture2d();
	table_donnee[8][4].load("textures/neptune.jpg");
	table_donnee[8][5] = (Mesh.Sphere(100)).renderer(true,true,true);

	let espace = Mesh.Sphere(100);
	espace_rend = espace.renderer(true,true,true);
	espace_tex = Texture2d();
	espace_tex.load("textures/stars.jpg");

	let soleil = Mesh.Sphere(100);
	soleil_rend = soleil.renderer(true,true,true);
	soleil_tex = Texture2d();
	soleil_tex.load("textures/sun.jpg");

	// place la camera pour bien voir l'objet
	scene_camera.show_scene(soleil.BB);
	scene_camera.set_scene_radius(700);

	ewgl_continuous_update = true;
	let now = new Date(Date.now());
	ewgl_current_time = now.getHours()*3600+now.getMinutes()*60;

}

function onkey_wgl(k) {
	switch (k) {
		case '+':
			// console.log("+");
			//on ne prends pas en compte la lune
			if(pos_orbit == 3) {
				pos_orbit +=1;
			}
			if(pos_orbit == 8) {
				pos_orbit = 0;
			} else {
				pos_orbit += 1;
			}
			break;
		case '-':
			// console.log("-");
			//on ne prends pas en compte la lune
			if(pos_orbit == 5) {
				pos_orbit -=1;
			}
			if(pos_orbit == 0 || pos_orbit == -1) {
				pos_orbit = 8;
			} else {
				pos_orbit -= 1;
			}
			break;
		case ' ':
			//repositionnement initial
			pos_orbit = -1;
			// console.log("space");
			break;
		case 'p':
			//basculement entre le focus sur les planetes ou sur les orbites
			planete *=-1;
			// console.log("p");
			// console.log(planete);
			break;
		default:
	}
	//console.log(pos_orbit);
}

function draw_wgl()
{
	gl.clearColor(0,0,0,1);
	gl.enable(gl.DEPTH_TEST);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// les matrices sont deduites de la camera
	const projection_matrix = scene_camera.get_projection_matrix();
	const view_matrix = scene_camera.get_view_matrix();

	let taille_sol = 1390000;
	let distance = 1*sl_distance.value/100;
	let taille = 100;
	let jour = 360*sl_speed.value/10;


	//creation et affichage des orbits
	prg_circ.bind();

	update_uniform('nb',100);
	for(let i = 0; i < 9; i++) {
		if(i != 4) {
			update_uniform('circleMatrix', mmult(projection_matrix, view_matrix, scale(table_donnee[i][0]*distance)));
		} else {
			//cas de la lune
			let taille_terre = (table_donnee[2][1]/taille_sol)*taille;
			let pos_terre = mmult(view_matrix, rotateZ((ewgl_current_time%360)*(jour/365)), translate(table_donnee[2][0]*distance,0,0),scale(taille_terre));
			update_uniform('circleMatrix',mmult(projection_matrix, pos_terre, scale(table_donnee[i][0]+0.5*distance)));
		}
		gl.drawArrays(gl.LINE_LOOP, 0, 100);
	}

	//creation et affichage des planetes et autres objets
	prg_white.bind();
	update_uniform('viewMatrix', view_matrix);
	update_uniform('projectionMatrix', projection_matrix)
	update_uniform('b', 0);
	update_uniform('decalage', ewgl_current_time/20);

	//sphere englobante
	let esp = mmult(view_matrix, scale(550));
	update_uniform('viewMatrix', esp);
	espace_tex.bind(0);
	espace_rend.draw(gl.TRIANGLES);

	//soleil
	let sol = mmult(view_matrix, rotateZ((ewgl_current_time%360)*(jour/22)), scale(6));
	update_uniform('viewMatrix', sol);
	soleil_tex.bind(0);
	soleil_rend.draw(gl.TRIANGLES);

	//pour les planetes de mercure à mars
	for(let i = 0; i < 4; i++) {
		let taille_plan = (table_donnee[i][1]/taille_sol)*taille;
		//rotation pour l'orbite - deplacement par rapport au soleil - rotation sur soi-même - agrandissement par rapport a la taille
		let matrix = mmult(view_matrix, rotateZ((ewgl_current_time%360)*(jour/table_donnee[i][2])), translate(table_donnee[i][0]*distance,0,0),rotateZ((ewgl_current_time%360)*(jour/table_donnee[i][3])), scale(taille_plan));
		update_uniform('viewMatrix', matrix);
		table_donnee[i][4].bind(0);
		if(i == 2) {
			table_donnee[i][6].bind(1);
			update_uniform('b',1);
		}
		table_donnee[i][5].draw(gl.TRIANGLES);
		update_uniform('b', 0);
	}

	//cas de la lune
	let taille_terre = (table_donnee[2][1]/taille_sol)*taille;
	let pos_terre = mmult(view_matrix, rotateZ((ewgl_current_time%360)*(jour/365)), translate(table_donnee[2][0]*distance,0,0),scale(taille_terre));
	let taille_lune = (table_donnee[4][1]/taille_sol)*taille;
	let matrix = mmult(pos_terre, rotateZ((ewgl_current_time%360)*(jour/table_donnee[4][2])), translate(table_donnee[4][0]+0.5*distance,0,0),rotateZ((ewgl_current_time%360)*(jour/table_donnee[4][3])), scale(taille_lune));
	update_uniform('viewMatrix', matrix);
	table_donnee[4][4].bind(0);
	table_donnee[4][5].draw(gl.TRIANGLES);

	//pour les planetes de jupiter à neptune
	for(let i = 5; i < 9; i++) {
		// diviser par 4 -> réduire plus la taille pour être mieux visible
		let taille_plan = (table_donnee[i][1]/taille_sol)*taille/4;
		let matrix = mmult(view_matrix, rotateZ((ewgl_current_time%360)*(jour/table_donnee[i][2])), translate(table_donnee[i][0]*distance,0,0),rotateZ((ewgl_current_time%360)*(jour/table_donnee[i][3])), scale(taille_plan));
		update_uniform('viewMatrix', matrix);
		table_donnee[i][4].bind(0);
		table_donnee[i][5].draw(gl.TRIANGLES);
	}

	//changement du focus de la caméra
	if(planete == 1 && pos_orbit != -1) {
		//focus sur une planete
		scene_camera.set_scene_center(mmult(rotateZ((ewgl_current_time%360)*(jour/table_donnee[pos_orbit][2])), translate(table_donnee[pos_orbit][0]*distance,0,0).vecmult(Vec4(0,0,0,1))));
	} else if(pos_orbit != -1) {
		//focus sur l'orbit d'une planete
		scene_camera.set_scene_center(Vec3(table_donnee[pos_orbit][0]*distance,0,0));
	} else {
		//focus sur le soleil
		scene_camera.set_scene_center(Vec3(0,0,0));
	}

	unbind_shader();
}


launch_3d();

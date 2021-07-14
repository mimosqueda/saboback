const { verifyToken, getDataToken } = require ('../utils/tokens.js')

// Importamos modelo
const Dish = require ('../models/DishModel.js');

// POST - Crear un plato
const addDish = async (req, res) => {

	// Cogemos el token de la cabecera de la llamada Post
	const token  = req.header('authorization').split(" ")[1];

	// Cogemos la info del body para generar el plato
	const { name, description, price, allergens, vegan, glutenFree, tags } = req.body;

	// Añadimos plato si el token ha sido verificado
	if (verifyToken(token)) {
		
		// Cogemos el userId de la info del token
		const { userId } = getDataToken(token);

		const newDish = new Dish({
			name,
			description,
			price,
			allergens,
			vegan,
			glutenFree,
			tags,
			seller : userId
		})

		newDish.save((err, savedInfo) =>{
			if (err) res.send('Error añadiendo plato:', err)
			res.json('Plato añadido!')
		})

	} else { 
		res.json('Para añadir un plato tienes que ser un usuario registrado') 
	}		
}

const getListOfDishes = async (req, res) => {
	//Funcion para gestionar el número de platos a devolver. Minimo 1 y máximo 64. Defecto 12
	const getLimitQuery = (limit) => {
		if(!limit) return 12;
		if(limit < 0) return 1;
		if(limit > 0 && limit <= 64) return limit;
		if(limit > 64) return 64;
	}

	// Funcion para buscar platos por una palabra. Ej: 'Lentejas'
	const getSearchDish = (search) => {
		if(!search) return;
		if(search) return {$text : {$search: search}}
	}

	// Funcion para evaluar true o false. Se puede usar en 'vegano' y 'glutenFree'
	const getTrueFalseQuery = (field, trueFalse) => {
		if(!trueFalse || !['true', 'false'].includes(trueFalse)) return;
		if(trueFalse === 'true') return { [field] : 'true' };
		if(trueFalse === 'false') return { [field] : 'false'};
	}

	// Query para buscar en la DB 
	const resultQuery = await Dish.find({
		... getSearchDish(req.query.text),
		... getTrueFalseQuery('vegan', req.query.vegan),
		... getTrueFalseQuery('glutenFree', req.query.glutenFree)
		}).sort('-dateCreation').populate('seller', 'name surname email').limit(getLimitQuery(Number(req.query.limit)))

	// Devolvemos resultados
	res.json(resultQuery)
}

// Exportamos como objeto
module.exports = {
	addDish,
	getListOfDishes
}
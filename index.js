import express from 'express';
import searchRoute from './routes/search.routes.js'

const app = express();

app.use(express.urlencoded({extended:false}));
app.use(express.json());

app.use(searchRoute);

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
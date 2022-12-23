import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Client } from "pg";
import filePath from "./filePath";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();
const PORT_NUMBER = process.env.PORT ?? 4000;
//update the env file after making an elephantSQL
const client = new Client(process.env.DATABASE_URL);
client.connect();

export interface highscoreItem {
  id: number;
  name: string;
  highscore: number;
}

// export interface nameText {
//   name: string;
// }

//API info page
app.get("/", (req, res) => {
  const pathToFile = filePath("../public/index.html");
  res.sendFile(pathToFile);
});

// GET /items
app.get("/items", async (req, res) => {
  try {
    const queryResponse = await client.query(`
      select * 
      from highscores 
      ORDER BY score DESC
    `);
    const allItems = queryResponse.rows;
    res.status(200).json(allItems);
  } catch (err) {
    console.error(err);
  }
});

// GET /items/:id
app.get<{ id: string }>("/items/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const values = [id];
    const queryResponse = await client.query(
      `
      select * 
      from highscores 
      where id = $1
    `,
      values
    );
    const matchingTodo = queryResponse.rows[0];
    res.status(200).json(matchingTodo);
  } catch (err) {
    console.error(err);
  }
});

// POST /items
app.post<{}, {}, highscoreItem>("/items", async (req, res) => {
  try {  
    const currentHighscores = await client.query(`
      SELECT * 
      FROM highscores 
      ORDER BY highscore DESC
    `);
    // insert the new highscore into the correct position in the array
    const newHighscores = [...currentHighscores.rows];
    let i = 0;
    while (i < newHighscores.length && req.body.highscore < newHighscores[i].highscore) {
      i++;
    }
    newHighscores.splice(i, 0, req.body);
    // update the database with the new highscores
    await client.query('DELETE FROM highscores');
    for (const hs of newHighscores) {
      await client.query('INSERT INTO highscores (name, highscore) VALUES (?, ?)', [hs.name, hs.highscore]);
    }
    res.status(201).json(req.body);
    await client.end();
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT_NUMBER, () => {
  console.log(`Server is listening on port ${PORT_NUMBER}!`);
});

// these functions won't be needed
// // DELETE /items/:id
// app.delete<{ id: string }>("/items/:id", async (req, res) => {
//   const values = [req.params.id];
//   try {
//     const queryResponse = await client.query(
//       `
//       delete from highscores
//       where id = $1
//       returning *
//     `,
//       values
//     );
//     const removedItem = queryResponse.rows[0];
//     res.status(200).json(removedItem);
//     // add if statement if rows are NOT 1
//   } catch (err) {
//     console.error(err);
//   }
// });

// // DELETE /highscore-items
// app.delete("/highscore-items", async (req, res) => {
//   try {
//     const queryResponse = await client.query(`
//       delete from highscores 
//       where highscore = true 
//       returning *
//     `);
//     const returnedItems = queryResponse.rows;
//     res.status(200).json(returnedItems);
//   } catch (err) {
//     console.error(err);
//   }
// });

// // PATCH /items/:id
// app.patch<{ id: string }, {}, Partial<highscoreItem>>(
//   "/items/:id",
//   async (req, res) => {
//     const patchData = req.body;
//     try {
//       if (patchData.name && patchData.highscore !== undefined) {
//         const values = [patchData.name, patchData.highscore, req.params.id];
//         const queryResponse = await client.query(
//           `
//         update highscores
//         set name = $1, highscore = $2
//         where id = $3
//         returning *
//       `,
//           values
//         );
//         const updatedItem = queryResponse.rows[0];
//         res.status(200).json(updatedItem);
//       } else if (
//         patchData.name === undefined &&
//         patchData.highscore !== undefined
//       ) {
//         const values = [patchData.highscore, req.params.id];
//         const queryResponse = await client.query(
//           `
//         update highscores
//         set highscore = $1
//         where id = $2
//         returning *
//       `,
//           values
//         );
//         const updatedItem = queryResponse.rows[0];
//         res.status(200).json(updatedItem);
//       } else if (patchData.name && patchData.highscore === undefined) {
//         const values = [patchData.name, req.params.id];
//         const queryResponse = await client.query(
//           `
//         update highscores
//         set name = $1
//         where id = $2
//         returning *  
//       `,
//           values
//         );
//         const updatedItem = queryResponse.rows[0];
//         res.status(200).json(updatedItem);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   }
// );

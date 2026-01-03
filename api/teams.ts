import clientPromise from './db';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('cricauction');
    const collection = db.collection('teams');

    switch (req.method) {
      case 'GET':
        const teams = await collection.find({}).toArray();
        res.status(200).json(teams);
        break;

      case 'POST':
        const data = req.body;
        if (Array.isArray(data)) {
            // Bulk insert
            if (data.length === 0) {
                res.status(200).json({ message: 'No data to insert' });
                return;
            }
            const result = await collection.insertMany(data);
            res.status(201).json({ message: `Inserted ${result.insertedCount} teams`, ids: result.insertedIds });
        } else {
            // Single insert
            const result = await collection.insertOne(data);
            res.status(201).json({ ...data, _id: result.insertedId });
        }
        break;

      case 'PUT':
        const { id, ...updateData } = req.body;
        if (!id) {
            res.status(400).json({ error: 'ID is required for update' });
            return;
        }
        const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };
        delete (updateData as any)._id;

        await collection.updateOne(filter, { $set: updateData });
        res.status(200).json({ message: 'Team updated' });
        break;

      case 'DELETE':
        const deleteId = req.query.id as string;
        if (deleteId) {
            const deleteFilter = ObjectId.isValid(deleteId) ? { _id: new ObjectId(deleteId) } : { id: deleteId };
            await collection.deleteOne(deleteFilter);
            res.status(200).json({ message: 'Team deleted' });
        } else {
            if (req.query.all === 'true') {
                await collection.deleteMany({});
                res.status(200).json({ message: 'All teams deleted' });
            } else {
                res.status(400).json({ error: 'ID is required for deletion' });
            }
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

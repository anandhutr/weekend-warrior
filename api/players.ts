import clientPromise from './db';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { ObjectId } from 'mongodb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('cricauction');
    const collection = db.collection('players');

    switch (req.method) {
      case 'GET':
        const players = await collection.find({}).toArray();
        res.status(200).json(players);
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
            res.status(201).json({ message: `Inserted ${result.insertedCount} players`, ids: result.insertedIds });
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
        // Handle both string IDs (from client generation) and ObjectIds
        const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: id };
        // Remove _id from updateData to avoid immutable field error
        delete (updateData as any)._id;

        await collection.updateOne(filter, { $set: updateData });
        res.status(200).json({ message: 'Player updated' });
        break;

      case 'DELETE':
        const deleteId = req.query.id as string;
        if (deleteId) {
            // Single delete
            const deleteFilter = ObjectId.isValid(deleteId) ? { _id: new ObjectId(deleteId) } : { id: deleteId };
            await collection.deleteOne(deleteFilter);
            res.status(200).json({ message: 'Player deleted' });
        } else {
            // Delete all (if explicitly requested via a query param or body, but for safety let's require a specific flag)
            // For now, let's assume this endpoint is only for single delete unless we add a 'deleteAll' param
            if (req.query.all === 'true') {
                await collection.deleteMany({});
                res.status(200).json({ message: 'All players deleted' });
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

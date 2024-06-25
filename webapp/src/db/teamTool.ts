import debug from 'debug';
import mongoose, { Schema, Document, Model, Query } from 'mongoose';
import CryptoJS from 'crypto-js';

const log = debug('webapp:db:teamTool');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key';

function encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

interface ITeamTool extends Document {
    teamId: mongoose.Schema.Types.ObjectId;
    toolId: mongoose.Schema.Types.ObjectId;
    apiKeys?: Map<string, string>;
}

const TeamToolSchema: Schema = new Schema({
    teamId: { type: mongoose.Schema.Types.ObjectId, required: true },
    toolId: { type: mongoose.Schema.Types.ObjectId, required: true },
    apiKeys: { type: Map, of: String, required: false },
});

TeamToolSchema.pre<ITeamTool>('save', function (next) {
    if (this.apiKeys) {
        const encryptedApiKeys = new Map();
        this.apiKeys.forEach((value, key) => {
            encryptedApiKeys.set(key, encrypt(value));
        });
        this.apiKeys = encryptedApiKeys;
    }
    next();
});

TeamToolSchema.pre<Query<ITeamTool, ITeamTool>>('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as Partial<ITeamTool> & { apiKeys?: Map<string, string> };

    if (update.apiKeys) {
        const encryptedApiKeys = new Map<string, string>();
        update.apiKeys.forEach((value, key) => {
            encryptedApiKeys.set(key, encrypt(value));
        });
        update.apiKeys = encryptedApiKeys;
    }

    next();
});

const TeamTool: Model<ITeamTool> = mongoose.model<ITeamTool>('TeamTool', TeamToolSchema);

export const createTeamTool = async (data: Partial<ITeamTool>): Promise<ITeamTool> => {
    try {
        const teamTool = new TeamTool(data);
        await teamTool.save();
        log('TeamTool created successfully');
        return teamTool;
    } catch (error) {
        log('Error creating TeamTool:', error);
        throw error;
    }
};

export const getTeamToolById = async (id: string): Promise<ITeamTool> => {
    try {
        const teamTool = await TeamTool.findById(id);
        if (!teamTool) {
            throw new Error('TeamTool not found');
        }
        return teamTool;
    } catch (error) {
        log('Error fetching TeamTool:', error);
        throw error;
    }
};

export const updateTeamToolById = async (id: string, data: Partial<ITeamTool>): Promise<ITeamTool> => {
    try {
        const teamTool = await TeamTool.findByIdAndUpdate(id, data, { new: true });
        if (!teamTool) {
            throw new Error('TeamTool not found');
        }
        log('TeamTool updated successfully');
        return teamTool;
    } catch (error) {
        log('Error updating TeamTool:', error);
        throw error;
    }
};

export const deleteTeamToolById = async (id: string): Promise<ITeamTool> => {
    try {
        const teamTool = await TeamTool.findByIdAndDelete(id);
        if (!teamTool) {
            throw new Error('TeamTool not found');
        }
        log('TeamTool deleted successfully');
        return teamTool;
    } catch (error) {
        log('Error deleting TeamTool:', error);
        throw error;
    }
};

export const getTeamToolsByTeamId = async (teamId: string): Promise<ITeamTool[]> => {
    try {
        const teamTools = await TeamTool.find({ teamId });
        return teamTools;
    } catch (error) {
        log('Error fetching TeamTools by teamId:', error);
        throw error;
    }
};
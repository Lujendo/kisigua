import { Env } from '../types/env';

export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata: {
    listingId: string;
    title: string;
    description: string;
    category: string;
    location: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: EmbeddingVector['metadata'];
}

export interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class EmbeddingService {
  private env: Env;
  private openaiApiKey: string;

  constructor(env: Env) {
    this.env = env;
    this.openaiApiKey = env.OPENAI_API_KEY || '';
  }

  /**
   * Generate embeddings for text using OpenAI's text-embedding-3-small model
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small', // 1536 dimensions, cost-effective
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data: EmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: 'text-embedding-3-small',
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data: EmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No embedding data received from OpenAI');
      }

      // Sort by index to maintain order
      return data.data
        .sort((a, b) => a.index - b.index)
        .map(item => item.embedding);
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Create searchable text from listing data
   */
  createSearchableText(listing: any): string {
    const parts = [
      listing.title || '',
      listing.description || '',
      listing.category || '',
      listing.location?.city || '',
      listing.location?.address || '',
      ...(listing.tags || []),
      listing.sustainability_practices || '',
      listing.certifications || ''
    ].filter(Boolean);

    return parts.join(' ').trim();
  }

  /**
   * Store embedding vector in Vectorize
   */
  async storeEmbedding(vector: EmbeddingVector): Promise<void> {
    try {
      await this.env.VECTORIZE.upsert([{
        id: vector.id,
        values: vector.values,
        metadata: vector.metadata
      }]);
      
      console.log(`✅ Stored embedding for listing ${vector.metadata.listingId}`);
    } catch (error) {
      console.error('Error storing embedding:', error);
      throw error;
    }
  }

  /**
   * Store multiple embedding vectors in batch
   */
  async storeBatchEmbeddings(vectors: EmbeddingVector[]): Promise<void> {
    if (vectors.length === 0) {
      return;
    }

    try {
      const vectorizeVectors = vectors.map(vector => ({
        id: vector.id,
        values: vector.values,
        metadata: vector.metadata
      }));

      await this.env.VECTORIZE.upsert(vectorizeVectors);
      
      console.log(`✅ Stored ${vectors.length} embeddings in batch`);
    } catch (error) {
      console.error('Error storing batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(queryEmbedding: number[], limit: number = 10, filter?: any): Promise<SearchResult[]> {
    try {
      const results = await this.env.VECTORIZE.query(queryEmbedding, {
        topK: limit,
        filter: filter,
        returnMetadata: true
      });

      return results.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata as EmbeddingVector['metadata']
      }));
    } catch (error) {
      console.error('Error searching similar vectors:', error);
      throw error;
    }
  }

  /**
   * Delete embedding by ID
   */
  async deleteEmbedding(id: string): Promise<void> {
    try {
      await this.env.VECTORIZE.deleteByIds([id]);
      console.log(`✅ Deleted embedding ${id}`);
    } catch (error) {
      console.error('Error deleting embedding:', error);
      throw error;
    }
  }

  /**
   * Delete multiple embeddings by IDs
   */
  async deleteBatchEmbeddings(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    try {
      await this.env.VECTORIZE.deleteByIds(ids);
      console.log(`✅ Deleted ${ids.length} embeddings`);
    } catch (error) {
      console.error('Error deleting batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Get embedding statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const stats = await this.env.VECTORIZE.describe();
      return stats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }

  /**
   * Process and store embedding for a listing
   */
  async processListingEmbedding(listing: any): Promise<void> {
    try {
      const searchableText = this.createSearchableText(listing);
      const embedding = await this.generateEmbedding(searchableText);
      
      const vector: EmbeddingVector = {
        id: `listing_${listing.id}`,
        values: embedding,
        metadata: {
          listingId: listing.id,
          title: listing.title || '',
          description: listing.description || '',
          category: listing.category || '',
          location: `${listing.location?.city || ''}, ${listing.location?.address || ''}`.trim(),
          tags: listing.tags || [],
          createdAt: listing.created_at || new Date().toISOString(),
          updatedAt: listing.updated_at || new Date().toISOString()
        }
      };

      await this.storeEmbedding(vector);
    } catch (error) {
      console.error(`Error processing embedding for listing ${listing.id}:`, error);
      throw error;
    }
  }

  /**
   * Process and store embeddings for multiple listings in batch
   */
  async processBatchListingEmbeddings(listings: any[]): Promise<void> {
    if (listings.length === 0) {
      return;
    }

    try {
      // Generate searchable texts
      const searchableTexts = listings.map(listing => this.createSearchableText(listing));
      
      // Generate embeddings in batch
      const embeddings = await this.generateBatchEmbeddings(searchableTexts);
      
      // Create vector objects
      const vectors: EmbeddingVector[] = listings.map((listing, index) => ({
        id: `listing_${listing.id}`,
        values: embeddings[index],
        metadata: {
          listingId: listing.id,
          title: listing.title || '',
          description: listing.description || '',
          category: listing.category || '',
          location: `${listing.location?.city || ''}, ${listing.location?.address || ''}`.trim(),
          tags: listing.tags || [],
          createdAt: listing.created_at || new Date().toISOString(),
          updatedAt: listing.updated_at || new Date().toISOString()
        }
      }));

      // Store in batch
      await this.storeBatchEmbeddings(vectors);
      
      console.log(`✅ Processed ${listings.length} listing embeddings`);
    } catch (error) {
      console.error('Error processing batch listing embeddings:', error);
      throw error;
    }
  }
}

import { NextResponse } from 'next/server';
import { Client, Databases } from 'appwrite';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    if (!projectId || !endpoint || !dbId) {
      return NextResponse.json(
        { status: 'error', message: 'Configurações do Appwrite ausentes.' },
        { status: 500 }
      );
    }

    const client = new Client().setEndpoint(endpoint).setProject(projectId);
    const databases = new Databases(client);
    
    // Fazemos uma requisição super leve para listar documentos de uma coleção qualquer
    // (mesmo que a coleção não exista ou falhe por permissão, a requisição em si registra atividade no Appwrite)
    await databases.listDocuments(dbId, 'tasks', []).catch(() => null);

    return NextResponse.json({ 
      status: 'ok', 
      message: 'Ping do Appwrite realizado com sucesso para evitar pausa por inatividade.' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message }, 
      { status: 500 }
    );
  }
}

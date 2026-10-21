/**
 * firestoreService.ts — sincronização das ocorrências e do histórico de
 * intervenções com o Cloud Firestore.
 *
 * Coleções:
 *   ocorrencias/{id}   — trechos em monitoramento
 *   intervencoes/{id}  — roçadas executadas (histórico permanente)
 *
 * A foto local (fotoUri) NÃO é enviada: um caminho file:// só existe no
 * aparelho que tirou a foto. (Evolução: Firebase Storage.)
 */

import { collection, doc, getDocs, setDoc } from "firebase/firestore";

import { Ocorrencia } from "../interfaces/ocorrencia";
import { Intervencao } from "../interfaces/intervencao";
import { db } from "./firebase";

function exigirDb() {
  if (!db) throw new Error("Firestore indisponível (Firebase não configurado).");
  return db;
}

export async function buscarOcorrencias(): Promise<Ocorrencia[]> {
  const snap = await getDocs(collection(exigirDb(), "ocorrencias"));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Ocorrencia, "id">), id: d.id }));
}

export async function salvarOcorrencia(o: Ocorrencia): Promise<void> {
  const { fotoUri: _fotoLocal, ...dados } = o;
  await setDoc(doc(exigirDb(), "ocorrencias", o.id), dados);
}

export async function buscarIntervencoes(): Promise<Intervencao[]> {
  const snap = await getDocs(collection(exigirDb(), "intervencoes"));
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Intervencao, "id">), id: d.id }));
}

export async function salvarIntervencao(i: Intervencao): Promise<void> {
  await setDoc(doc(exigirDb(), "intervencoes", i.id), i);
}

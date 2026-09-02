# Fase 6 — Supabase Realtime

O StudioDesk agora possui uma camada Realtime baseada em um único canal multiplexado por workspace.

## Eventos

O canal acompanha INSERT, UPDATE e DELETE de leads, clientes, Kanban, projetos, entregáveis, aprovações, agenda, tarefas, mensagens, comunicações, timeline, equipe e integrações.

## Estratégia de custo

Eventos próximos são agrupados em uma janela de 350 ms. Em vez de disparar uma nova carga completa para cada evento, o cliente faz uma única sincronização para o lote recebido.

O canal é criado somente depois que a sessão e o workspace estão hidratados e é removido ao sair/desmontar o aplicativo.

## Segurança

As assinaturas são filtradas por `workspace_id` e continuam sujeitas às políticas RLS do Supabase. `REPLICA IDENTITY FULL` foi habilitado para que exclusões possam carregar os dados antigos necessários ao filtro.

## Ativação

O bloco final de `supabase/schema.sql` adiciona as tabelas à publicação `supabase_realtime`. Execute o schema completo no SQL Editor quando formos configurar o projeto real.

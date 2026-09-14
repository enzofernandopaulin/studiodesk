# Fase 5 — paginação e consultas

O carregamento inicial consulta primeiro os 100 projetos visíveis e só então busca entregáveis, mídias e comentários ligados a esses IDs. O carregamento incremental de clientes volta a consultar a tabela correta e não recarrega todos os módulos dependentes durante paginação.

A pesquisa global continua limitada ao conjunto carregado nesta fase; pesquisa remota e cursores estáveis permanecem como evolução posterior.

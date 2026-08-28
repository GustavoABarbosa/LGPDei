from app.agents.graph import agent_graph, build_graph


def test_graph_builds():
    graph = build_graph()
    assert graph is not None
    assert agent_graph is not None

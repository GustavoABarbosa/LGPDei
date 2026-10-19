"""Rebuild the static LGPD PageIndex tree from knowledge/lei-13709-2018.md."""

from app.services.knowledge_service import get_knowledge_manifest, save_corpus_index


def main() -> None:
    tree = save_corpus_index()
    manifest = get_knowledge_manifest()
    node_count = len(tree.get("nodes", {}))
    print(
        f"Index rebuilt: {node_count} nodes | knowledge version {manifest['version']} "
        f"-> app/knowledge/lei-13709.pageindex.json"
    )


if __name__ == "__main__":
    main()

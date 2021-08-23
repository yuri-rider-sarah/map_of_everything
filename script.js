function newEntity(name, url, article) {
    const child = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = name;
    if (article !== null) {
        const wp_link = document.createElement('a');
        wp_link.textContent = 'W';
        wp_link.setAttribute('href', article);
        wp_link.setAttribute('target', '_blank');
        summary.appendChild(wp_link);
    }
    const wd_link = document.createElement('a');
    wd_link.textContent = 'Q';
    wd_link.setAttribute('href', url);
    wd_link.setAttribute('target', '_blank');
    summary.appendChild(wd_link);
    child.appendChild(summary);
    child.dataset.url = url;
    child.dataset.loaded = 'false';
    child.onclick = () => entityClick(child);
    return child;
}

function addEntityChildren(node, data, labelName) {
    if (data.results.bindings.length === 0) {
        return;
    }
    const label = document.createElement('p');
    label.setAttribute('class', 'label');
    label.textContent = labelName;
    node.appendChild(label);
    const list = document.createElement('ul');
    node.appendChild(list);
    for (const childData of data.results.bindings) {
        const article = childData.hasOwnProperty('article') ? childData.article.value : null;
        const child = newEntity(childData.name.value, childData.item.value, article);
        const listItem = document.createElement('li');
        listItem.appendChild(child);
        list.appendChild(listItem);
    }
}

async function loadEntityChildren(node, dataUrl, label, predicateId) {
    const query =
`SELECT ?item (SAMPLE(COALESCE(?enName, ?anyName)) AS ?name) (SAMPLE(?article) as ?article) WHERE {
?item wdt:P${predicateId} <${dataUrl}>
OPTIONAL { ?article schema:about ?item. ?article schema:isPartOf <https://en.wikipedia.org/>. }
OPTIONAL { ?item rdfs:label ?enName . FILTER(LANG(?enName) = "en") }
OPTIONAL { ?item rdfs:label ?anyName }
} GROUP BY ?item`
    const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
    const response = await fetch(url);
    const data = await response.json();
    addEntityChildren(node, data, label);
}

async function entityClick(node) {
    if (node.dataset.loaded === 'false' && !node.open) {
        node.dataset.loaded = 'true';
        const contents = document.createElement('div');
        contents.setAttribute('class', 'contents');
        const dummy = document.createElement('p');
        dummy.setAttribute('class', 'loading');
        dummy.textContent = '...';
        node.appendChild(dummy);
        try {
            await loadEntityChildren(contents, node.dataset.url, "subclasses", "279");
            await loadEntityChildren(contents, node.dataset.url, "instances", "31");
            await loadEntityChildren(contents, node.dataset.url, "parts", "361");
            dummy.remove();
            node.appendChild(contents);
            if (contents.children.length === 0) {
                contents.remove();
                node.setAttribute('class', 'empty');
            }
        } catch (e) {
            dummy.textContent = 'Error!';
            dummy.setAttribute('class', 'error');
            console.error(e);
        }
    }
}

const root = newEntity('entity', 'http://www.wikidata.org/entity/Q35120', 'https://en.wikipedia.org/wiki/Something_(concept)');
root.onclick = () => entityClick(root);
document.body.appendChild(root);

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Node {
  id: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

export default function NetworkFlow({ packets }: { packets: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<any>(null);
  const nodesRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!svgRef.current || packets.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const linksMap = new Map<string, Link>();
    const currentNodesMap = new Map<string, any>();

    packets.forEach(pkt => {
      if (!currentNodesMap.has(pkt.src)) {
        const existing = nodesRef.current.get(pkt.src);
        currentNodesMap.set(pkt.src, existing ? { ...existing } : { id: pkt.src, group: 1 });
      }
      if (!currentNodesMap.has(pkt.dst)) {
        const existing = nodesRef.current.get(pkt.dst);
        currentNodesMap.set(pkt.dst, existing ? { ...existing } : { id: pkt.dst, group: 2 });
      }

      const linkId = `${pkt.src}-${pkt.dst}`;
      if (linksMap.has(linkId)) {
        linksMap.get(linkId)!.value += 1;
      } else {
        linksMap.set(linkId, { source: pkt.src, target: pkt.dst, value: 1 });
      }
    });

    nodesRef.current = currentNodesMap;
    const nodes = Array.from(currentNodesMap.values());
    const links = Array.from(linksMap.values());

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove(); // Still clear for simplicity, but nodes keep x/y

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation()
        .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-150))
        .force('center', d3.forceCenter(width / 2, height / 2));
    }

    const simulation = simulationRef.current;
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(0.3).restart();

    const link = svg.append('g')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.sqrt(d.value));

    const node = svg.append('g')
      .attr('stroke', '#141414')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 6)
      .attr('fill', d => d.group === 1 ? '#00FF00' : '#00A3FF')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('title')
      .text(d => d.id);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => Math.max(6, Math.min(width - 6, d.x)))
        .attr('cy', (d: any) => Math.max(6, Math.min(height - 6, d.y)));
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      // Don't stop simulation completely on unmount if we want to keep it running, 
      // but standard practice is to stop it.
      // simulation.stop();
    };
  }, [packets]);

  return (
    <svg ref={svgRef} className="w-full h-full" />
  );
}

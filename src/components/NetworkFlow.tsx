import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

type NodeDatum = d3.SimulationNodeDatum & {
  id: string;
  group: number;
};

type LinkDatum = d3.SimulationLinkDatum<NodeDatum> & {
  source: string | NodeDatum;
  target: string | NodeDatum;
  value: number;
};

type ViewportSize = {
  width: number;
  height: number;
};

const NODE_RADIUS = 6;
const VIEW_PADDING = 16;

export default function NetworkFlow({ packets }: { packets: any[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<NodeDatum, undefined> | null>(null);
  const nodesRef = useRef<Map<string, NodeDatum>>(new Map());
  const [viewport, setViewport] = useState<ViewportSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const target = svgRef.current;
    const updateSize = () => {
      const rect = target.getBoundingClientRect();
      setViewport({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height)),
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || packets.length === 0 || viewport.width <= 0 || viewport.height <= 0) {
      return;
    }

    const width = viewport.width;
    const height = viewport.height;

    const linksMap = new Map<string, LinkDatum>();
    const currentNodesMap = new Map<string, NodeDatum>();

    packets.forEach((pkt) => {
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

    svg.selectAll('*').remove();

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<NodeDatum>()
        .force('link', d3.forceLink<NodeDatum, LinkDatum>().id((d) => d.id).distance(90).strength(0.35))
        .force('charge', d3.forceManyBody().strength(-90))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide<NodeDatum>(NODE_RADIUS + 2));
    }

    const simulation = simulationRef.current;
    const centerForce = simulation.force('center') as d3.ForceCenter<NodeDatum> | undefined;
    if (centerForce) {
      centerForce.x(width / 2).y(height / 2);
    }

    simulation.nodes(nodes);
    const linkForce = simulation.force('link') as d3.ForceLink<NodeDatum, LinkDatum> | undefined;
    if (linkForce) {
      linkForce.links(links);
    }
    simulation.alpha(0.45).restart();

    const root = svg.append('g');

    const link = root.append('g')
      .attr('stroke', '#333')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.max(1, Math.sqrt(d.value)));

    const node = root.append('g')
      .attr('stroke', '#141414')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', (d) => (d.group === 1 ? '#00FF00' : '#00A3FF'))
      .call(
        d3.drag<SVGCircleElement, NodeDatum>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    node.append('title').text((d) => d.id);

    const clampCoordinate = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

    simulation.on('tick', () => {
      const xValues = nodes.map((n) => n.x ?? width / 2);
      const yValues = nodes.map((n) => n.y ?? height / 2);

      const minX = d3.min(xValues) ?? width / 2;
      const maxX = d3.max(xValues) ?? width / 2;
      const minY = d3.min(yValues) ?? height / 2;
      const maxY = d3.max(yValues) ?? height / 2;

      const spanX = Math.max(1, maxX - minX);
      const spanY = Math.max(1, maxY - minY);

      const maxDrawableWidth = Math.max(1, width - (VIEW_PADDING * 2) - (NODE_RADIUS * 2));
      const maxDrawableHeight = Math.max(1, height - (VIEW_PADDING * 2) - (NODE_RADIUS * 2));
      const scale = Math.min(1, maxDrawableWidth / spanX, maxDrawableHeight / spanY);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      const mapX = (value: number) => {
        const scaled = ((value - midX) * scale) + (width / 2);
        return clampCoordinate(scaled, VIEW_PADDING + NODE_RADIUS, width - VIEW_PADDING - NODE_RADIUS);
      };

      const mapY = (value: number) => {
        const scaled = ((value - midY) * scale) + (height / 2);
        return clampCoordinate(scaled, VIEW_PADDING + NODE_RADIUS, height - VIEW_PADDING - NODE_RADIUS);
      };

      link
        .attr('x1', (d) => mapX((d.source as NodeDatum).x ?? width / 2))
        .attr('y1', (d) => mapY((d.source as NodeDatum).y ?? height / 2))
        .attr('x2', (d) => mapX((d.target as NodeDatum).x ?? width / 2))
        .attr('y2', (d) => mapY((d.target as NodeDatum).y ?? height / 2));

      node
        .attr('cx', (d) => mapX(d.x ?? width / 2))
        .attr('cy', (d) => mapY(d.y ?? height / 2));
    });

    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>) {
      if (!event.active) {
        simulation.alphaTarget(0.3).restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>) {
      if (!event.active) {
        simulation.alphaTarget(0);
      }
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.on('tick', null);
    };
  }, [packets, viewport.width, viewport.height]);

  return <svg ref={svgRef} className="w-full h-full" />;
}
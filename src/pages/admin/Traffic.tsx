import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X, Loader } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { io } from 'socket.io-client';
import NetworkFlow from '../../components/NetworkFlow';
import { dbApi } from '../../lib/api';

export default function Traffic() {
  const [packets, setPackets] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [selectedPacket, setSelectedPacket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [protocolData, setProtocolData] = useState([
    { name: 'TCP', value: 65, color: '#00FF00' },
    { name: 'UDP', value: 25, color: '#00A3FF' },
    { name: 'ICMP', value: 10, color: '#FFB800' },
  ]);

  useEffect(() => {
    const socketOrigin = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketOrigin, {
      transports: ['websocket', 'polling']
    });

    socket.on('new_packets', (newPackets) => {
      setPackets(prev => {
        const updated = [...newPackets, ...prev].slice(0, 150); // Keep last 150 packets
        
        // Calculate simple distribution from live packets
        const counts = updated.reduce((acc: any, pkt: any) => {
          acc[pkt.proto] = (acc[pkt.proto] || 0) + 1;
          return acc;
        }, {});
        
        const total = updated.length;
        if (total > 0) {
          setProtocolData([
            { name: 'TCP', value: Math.round(((counts['TCP'] || 0) / total) * 100), color: '#00FF00' },
            { name: 'UDP', value: Math.round(((counts['UDP'] || 0) / total) * 100), color: '#00A3FF' },
            { name: 'ICMP', value: Math.round(((counts['ICMP'] || 0) / total) * 100), color: '#FFB800' },
          ]);
        }

        return updated;
      });
    });

    const fetchInitialPackets = async () => {
      try {
        const data = await dbApi.getLogs();
        const mappedData = data.map((log: any) => ({
          id: log.id,
          time: new Date(log.created_at).toLocaleTimeString(),
          src: log.source_ip,
          dst: log.destination_ip,
          proto: log.protocol,
          size: `${log.packet_size}B`,
          flag: log.flags || '-',
          status: log.action_taken === 'blocked' ? 'DROP' : 'ALLOW'
        }));
        setPackets(mappedData);
      } catch (error) {
        console.error('Failed to fetch initial packets from DB:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialPackets();

    return () => {
      socket.disconnect();
    };
  }, []);

  const filteredPackets = packets.filter(pkt => {
    const matchesSearch = pkt.src.includes(searchQuery) || pkt.dst.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || pkt.status === statusFilter;
    const matchesProtocol = protocolFilter === 'ALL' || pkt.proto === protocolFilter;
    const matchesFlag = flagFilter === 'ALL' || pkt.flag === flagFilter;
    
    let matchesSize = true;
    if (sizeFilter !== 'ALL') {
      const sizeNum = parseInt(pkt.size.replace('B', ''));
      if (sizeFilter === '<500B') matchesSize = sizeNum < 500;
      else if (sizeFilter === '500B-1KB') matchesSize = sizeNum >= 500 && sizeNum <= 1024;
      else if (sizeFilter === '>1KB') matchesSize = sizeNum > 1024;
    }

    return matchesSearch && matchesStatus && matchesProtocol && matchesFlag && matchesSize;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Traffic Analysis</h1>
          <p className="text-sm text-text-secondary mt-1">Deep packet inspection and protocol distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="bg-bg-surface border border-border-subtle rounded-lg px-4 py-2 text-sm text-text-primary outline-none focus:border-brand transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ALLOW">Allowed</option>
            <option value="DROP">Dropped</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border-subtle rounded-lg text-sm hover:border-border-strong transition-colors">
            <Download className="w-4 h-4" /> Export PCAP
          </button>
        </div>
      </div>

      {/* Protocol Distribution & Network Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bento-card p-6 flex flex-col">
          <h3 className="text-sm font-medium text-text-primary mb-4">Protocol Distribution</h3>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`${value}%`, 'Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-text-muted font-mono">LIVE</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {protocolData.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs font-mono">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-text-secondary">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-2 bento-card p-6 flex flex-col h-80">
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-sm font-medium text-text-primary">Live Network Flow</h3>
             <span className="text-xs font-mono text-text-muted">Force Directed Graph</span>
           </div>
           <div className="flex-1 w-full h-full relative overflow-hidden bg-bg-base/30 rounded-lg border border-border-subtle">
             {isLoading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                 <Loader className="w-6 h-6 animate-spin text-brand" />
               </div>
             ) : (
               <NetworkFlow packets={packets} />
             )}
           </div>
        </div>
      </div>

      {/* Packet Log Table */}
      <div className="bento-card overflow-hidden w-full">
        <div className="p-4 border-b border-border-subtle flex flex-col lg:flex-row items-center justify-between bg-bg-surface/50 gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-48 flex-grow lg:flex-grow-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search IP..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-base border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:border-border-strong transition-colors"
              />
            </div>
            <select 
              className="bg-bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand transition-colors flex-grow sm:flex-grow-0"
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
            >
              <option value="ALL">All Protocols</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
            <select 
              className="bg-bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand transition-colors flex-grow sm:flex-grow-0"
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
            >
              <option value="ALL">All Sizes</option>
              <option value="<500B">&lt; 500B</option>
              <option value="500B-1KB">500B - 1KB</option>
              <option value=">1KB">&gt; 1KB</option>
            </select>
            <select 
              className="bg-bg-base border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-brand transition-colors flex-grow sm:flex-grow-0"
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
            >
              <option value="ALL">All Flags</option>
              <option value="SYN">SYN</option>
              <option value="ACK">ACK</option>
              <option value="FIN">FIN</option>
              <option value="-">None</option>
            </select>
          </div>
          <div className="text-xs font-mono text-text-muted whitespace-nowrap self-start lg:self-center">Showing {filteredPackets.length} packets</div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-text-muted font-mono uppercase bg-bg-base/50">
              <tr>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">Source IP</th>
                <th className="px-6 py-3 font-medium">Dest IP</th>
                <th className="px-6 py-3 font-medium">Proto</th>
                <th className="px-6 py-3 font-medium">Size</th>
                <th className="px-6 py-3 font-medium">Flags</th>
                <th className="px-6 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-brand">
                    <Loader className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredPackets.map((pkt) => (
                <tr 
                  key={pkt.id} 
                  className="hover:bg-bg-panel transition-colors cursor-pointer"
                  onClick={() => setSelectedPacket(pkt)}
                >
                  <td className="px-6 py-3 text-text-secondary">{pkt.time}</td>
                  <td className="px-6 py-3 text-text-primary">{pkt.src}</td>
                  <td className="px-6 py-3 text-text-secondary">{pkt.dst}</td>
                  <td className="px-6 py-3">{pkt.proto}</td>
                  <td className="px-6 py-3 text-text-secondary">{pkt.size}</td>
                  <td className="px-6 py-3 text-text-secondary">{pkt.flag}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-1 rounded-md ${pkt.status === 'ALLOW' ? 'bg-brand-dim text-brand' : 'bg-danger-dim text-danger'}`}>
                      {pkt.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredPackets.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-muted">No packets found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Details Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-surface border border-border-strong rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-panel">
              <h3 className="text-lg font-medium text-text-primary flex items-center gap-2">
                Packet Details <span className="text-xs font-mono text-text-muted bg-bg-base px-2 py-1 rounded truncate max-w-[120px]" title={selectedPacket.id}>{selectedPacket.id}</span>
              </h3>
              <button 
                onClick={() => setSelectedPacket(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Source</div>
                  <div className="font-mono text-sm text-text-primary break-all">{selectedPacket.src}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Destination</div>
                  <div className="font-mono text-sm text-text-primary break-all">{selectedPacket.dst}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Protocol</div>
                  <div className="font-mono text-sm text-text-primary">{selectedPacket.proto}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Size</div>
                  <div className="font-mono text-sm text-text-primary">{selectedPacket.size}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Flags</div>
                  <div className="font-mono text-sm text-text-primary">{selectedPacket.flag}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-muted uppercase tracking-wider">Status</div>
                  <div className={`font-mono text-sm ${selectedPacket.status === 'ALLOW' ? 'text-brand' : 'text-danger'}`}>
                    {selectedPacket.status}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Raw Headers (Hex)</div>
                <div className="bg-bg-base border border-border-subtle rounded-lg p-3 font-mono text-xs text-text-secondary whitespace-pre-wrap break-all">
                  {`45 00 00 3c 1c 46 40 00 40 06 b1 e6 c0 a8 00 68\n0a 00 00 01 c0 22 00 50 00 00 00 00 00 00 00 00\n50 02 20 00 44 33 00 00`}
                </div>
              </div>

              <div>
                <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Payload Snippet</div>
                <div className="bg-bg-base border border-border-subtle rounded-lg p-3 font-mono text-xs text-text-secondary whitespace-pre-wrap break-all">
                  {selectedPacket.proto === 'HTTP' || selectedPacket.proto === 'TCP' ? 
                    `GET / HTTP/1.1\r\nHost: 10.0.0.1\r\nUser-Agent: curl/7.68.0\r\nAccept: */*\r\n\r\n` : 
                    `... binary payload ...`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

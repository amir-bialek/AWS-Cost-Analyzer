import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm border-b border-white/10 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Cost Categories Explained</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 text-slate-200 space-y-8">
          <div>
            <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
              📦 S3 (Simple Storage Service)
            </h3>
            <div className="grid gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Storage</h4>
                <p className="text-slate-300 text-sm">
                  Cost for storing data in S3 buckets. Includes Standard, Reduced Redundancy, Glacier, 
                  and Intelligent Tiering storage classes. Charged per GB-month.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Data Transfer Out</h4>
                <p className="text-slate-300 text-sm">
                  Cost for transferring data out of S3 to the internet or other AWS regions. 
                  First 1GB per month is free, then charged per GB transferred.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Requests</h4>
                <p className="text-slate-300 text-sm">
                  Cost for API calls to S3 (GET, PUT, POST, LIST, COPY, etc.). 
                  Different request types have different pricing tiers.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Management & Analytics</h4>
                <p className="text-slate-300 text-sm">
                  Cost for S3 features like inventory reports, analytics, insights, and monitoring services.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center gap-2">
              🖥️ EC2 (Elastic Compute Cloud)
            </h3>
            <div className="grid gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Compute</h4>
                <p className="text-slate-300 text-sm">
                  Cost for running EC2 instances. Includes instance hours, vCPU usage, and box usage charges. 
                  Varies by instance type and size.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Data Transfer Out</h4>
                <p className="text-slate-300 text-sm">
                  Cost for transferring data out of EC2 instances to the internet or other regions. 
                  First 1GB per month is free.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Load Balancing</h4>
                <p className="text-slate-300 text-sm">
                  Cost for Elastic Load Balancer (ELB) services including Application Load Balancer (ALB), 
                  Network Load Balancer (NLB), and Classic Load Balancer.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-purple-400 mb-4 flex items-center gap-2">
              💾 EBS (Elastic Block Store)
            </h3>
            <div className="grid gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Volume Storage</h4>
                <p className="text-slate-300 text-sm">
                  Cost for EBS volume storage. Charged per GB-month for provisioned storage, 
                  regardless of actual usage. Different volume types (gp3, gp2, io1, io2, st1, sc1) have different rates.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Snapshots</h4>
                <p className="text-slate-300 text-sm">
                  Cost for EBS snapshot storage in S3. Charged per GB-month for actual data stored. 
                  Incremental backups only store changed data.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Provisioned IOPS</h4>
                <p className="text-slate-300 text-sm">
                  Cost for provisioned IOPS on io1 and io2 volumes. Charged per IOPS-month 
                  for guaranteed performance levels.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
              💰 Cost Types
            </h3>
            <div className="grid gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Cost Before Credit</h4>
                <p className="text-slate-300 text-sm">
                  The raw cost you would pay for AWS services before any credits, discounts, or savings plans are applied. 
                  This represents the list price for your usage.
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-400 mb-2">Cost After Credit</h4>
                <p className="text-slate-300 text-sm">
                  The actual cost you pay after all credits, discounts, savings plans, and reserved instance discounts are applied. 
                  This is what appears on your bill.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
              💡 Cost Optimization Tips
            </h4>
            <ul className="text-slate-300 text-sm space-y-1 list-disc list-inside">
              <li>Focus on resources with the highest "Cost Before Credit" to identify optimization opportunities</li>
              <li>Look for high "Data Transfer Out" costs which often indicate inefficient architectures</li>
              <li>Monitor "Storage" costs in S3 and consider lifecycle policies for infrequently accessed data</li>
              <li>Review "Compute" costs in EC2 and consider rightsizing instances or using spot instances</li>
              <li>Check "Provisioned IOPS" usage and ensure you're not over-provisioning performance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;

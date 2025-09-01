'use client';
import React from 'react';

interface CurSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CurSetupModal({ isOpen, onClose }: CurSetupModalProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            📊 How to generate AWS CUR .parquet files
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Configure AWS Cost and Usage Report (CUR)
              </h3>
              <p className="text-gray-600 mb-3">
                In the AWS console, navigate to <strong>Billing & Cost Management → Cost and Usage Reports</strong>
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Required configuration:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✅ <strong>Report type:</strong> Standard Data Export (no Legacy)</li>
                  <li>✅ <strong>Data export version:</strong> CUR 2.0</li>
                  <li>✅ <strong>File format:</strong> Parquet (obligatorio)</li>
                  <li>✅ <strong>Compression:</strong> GZIP (recomendado)</li>
                  <li>✅ <strong>Time granularity:</strong> Daily o Hourly</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    📖 <a
                      href="https://docs.aws.amazon.com/cur/latest/userguide/cur-create.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-800 underline"
                    >
                      Step-by-step guide to create a CUR
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Verify required columns
              </h3>
              <p className="text-gray-600 mb-3">
                The analyzer requires these specific columns in your .parquet file:
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Required columns:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
                  <div>• <code>line_item_line_item_type</code></div>
                  <div>• <code>line_item_usage_amount</code></div>
                  <div>• <code>line_item_product_code</code></div>
                  <div>• <code>line_item_usage_type</code></div>
                  <div>• <code>pricing_unit</code></div>
                  <div>• <code>product.product_name</code> (opcional)</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Configure destination S3 bucket
              </h3>
              <p className="text-gray-600 mb-3">
                Specify an S3 bucket where AWS will deposit CUR files:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Create a dedicated S3 bucket for CUR</li>
                <li>• Configure necessary permissions for AWS Billing</li>
                <li>• Define a prefix to organize files</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">
                Download and use files
              </h3>
              <p className="text-gray-600 mb-3">
                Once configured, AWS will generate files daily:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Files will appear in your S3 bucket within 24-48 hours</li>
                <li>• Download .parquet files (not .csv)</li>
                <li>• Use individual files, not manifests</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-green-800">🔒 Privacy and Security of your Data</h4>
                <div className="mt-2 text-sm text-green-700">
                  <ul className="space-y-1">
                    <li>• <strong>Your data is NOT saved:</strong> .parquet files are only processed temporarily</li>
                    <li>• <strong>Local processing:</strong> Analysis is performed in memory and discarded immediately</li>
                    <li>• <strong>No persistence:</strong> No databases, permanent logs or data storage</li>
                    <li>• <strong>Total privacy:</strong> Your AWS billing data remains completely private</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Important notes:</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="space-y-1">
                    <li>• CUR files can take up to 24 hours to generate</li>
                    <li>• Make sure to use CUR 2.0, not the legacy version</li>
                    <li>• Parquet format is more efficient than CSV for large files</li>
                    <li>• Files can be several MB or GB depending on usage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Expected structure example:</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`line_item_line_item_type | line_item_usage_amount | line_item_product_code | ...
Usage                    | 100.5                  | AmazonEC2              | ...
SavingsPlanCoveredUsage  | 50.2                   | AmazonS3               | ...
DiscountedUsage          | 25.8                   | AmazonRDS              | ...`}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-gray-500">
              <div className="mb-2">
                🔒 <strong>Reminder:</strong> Your data is processed locally and not stored on any server.
              </div>
              <div>
                💡 Need more help?{' '}
                <a
                  href="https://docs.aws.amazon.com/cur/latest/userguide/what-is-cur.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Check the official AWS CUR documentation
                </a>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg transition-colors flex-shrink-0"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

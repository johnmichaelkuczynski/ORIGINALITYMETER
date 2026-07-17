import HomeworkHelper from '@/components/HomeworkHelper';

export default function HomeworkHelperPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Homework Helper</h1>
        <p className="text-lg text-gray-600">
          Get complete solutions to your assignments with perfect mathematical notation. 
          Upload your homework via documents or screenshots, and receive detailed step-by-step solutions.
        </p>
      </div>
      
      <HomeworkHelper />
    </div>
  );
}
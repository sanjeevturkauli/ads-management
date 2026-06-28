import { Head } from '@inertiajs/react';
import { BookOpen, Code, Key, Lock } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type Parameter = {
    name: string;
    type: string;
    required: boolean;
    description: string;
};

type Endpoint = {
    method: string;
    path: string;
    description: string;
    auth: boolean;
    parameters: Parameter[];
    response: Record<string, string>;
};

type EndpointGroup = {
    group: string;
    endpoints: Endpoint[];
};

type Props = {
    apiEndpoints: EndpointGroup[];
    baseUrl: string;
};

const methodColors: Record<string, string> = {
    GET: 'bg-blue-500',
    POST: 'bg-green-500',
    PUT: 'bg-yellow-500',
    DELETE: 'bg-red-500',
    PATCH: 'bg-purple-500',
};

export default function ApiDocumentationIndex({ apiEndpoints, baseUrl }: Props) {
    return (
        <>
            <Head title="API Documentation" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6" />
                        API Documentation
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        RESTful API endpoints for mobile application integration
                    </p>
                </div>

                {/* Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>How to authenticate and use the API</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Base URL
                            </h4>
                            <code className="block bg-muted p-3 rounded-md text-sm">
                                {baseUrl}/api/v1
                            </code>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Authentication
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                Include your API key in the request header:
                            </p>
                            <code className="block bg-muted p-3 rounded-md text-sm">
                                Authorization: Bearer YOUR_API_KEY
                            </code>
                        </div>

                        <div>
                            <h4 className="font-medium mb-2">Response Format</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                All responses are returned in JSON format:
                            </p>
                            <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "message": "Success message"
}`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                {/* API Endpoints */}
                {apiEndpoints.map((group) => (
                    <Card key={group.group}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="h-5 w-5" />
                                {group.group}
                            </CardTitle>
                            <CardDescription>
                                Endpoints related to {group.group.toLowerCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {group.endpoints.map((endpoint, index) => (
                                <div key={index} className="space-y-4 pb-6 border-b last:border-0 last:pb-0">
                                    {/* Endpoint Header */}
                                    <div className="flex items-start gap-3">
                                        <Badge className={`${methodColors[endpoint.method]} text-white`}>
                                            {endpoint.method}
                                        </Badge>
                                        <div className="flex-1">
                                            <code className="text-sm font-medium">
                                                {endpoint.path}
                                            </code>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {endpoint.description}
                                            </p>
                                            {endpoint.auth && (
                                                <Badge variant="outline" className="mt-2">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Requires Authentication
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parameters */}
                                    {endpoint.parameters.length > 0 && (
                                        <div>
                                            <h5 className="text-sm font-medium mb-2">Parameters</h5>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Required</TableHead>
                                                        <TableHead>Description</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {endpoint.parameters.map((param, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-mono text-sm">
                                                                {param.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary">
                                                                    {param.type}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant={
                                                                        param.required
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                >
                                                                    {param.required ? 'Yes' : 'No'}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm">
                                                                {param.description}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}

                                    {/* Response */}
                                    <div>
                                        <h5 className="text-sm font-medium mb-2">Response</h5>
                                        <div className="bg-muted rounded-md p-3">
                                            <pre className="text-sm">
{`{
  "success": true,
  "data": {
${Object.entries(endpoint.response).map(([key, value]) => `    "${key}": "${value}"`).join(',\n')}
  }
}`}
                                            </pre>
                                        </div>
                                    </div>

                                    {/* Example Request */}
                                    <div>
                                        <h5 className="text-sm font-medium mb-2">Example Request</h5>
                                        <code className="block bg-muted p-3 rounded-md text-sm">
                                            curl -X {endpoint.method} {baseUrl}{endpoint.path}
                                            {endpoint.auth && ' \\\n  -H "Authorization: Bearer YOUR_API_KEY"'}
                                        </code>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                {/* Error Codes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Error Codes</CardTitle>
                        <CardDescription>Common HTTP status codes and their meanings</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell><Badge className="bg-green-500">200</Badge></TableCell>
                                    <TableCell>OK</TableCell>
                                    <TableCell>Request successful</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-yellow-500">400</Badge></TableCell>
                                    <TableCell>Bad Request</TableCell>
                                    <TableCell>Invalid request parameters</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-orange-500">401</Badge></TableCell>
                                    <TableCell>Unauthorized</TableCell>
                                    <TableCell>Invalid or missing API key</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-red-500">403</Badge></TableCell>
                                    <TableCell>Forbidden</TableCell>
                                    <TableCell>Access denied</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-red-500">404</Badge></TableCell>
                                    <TableCell>Not Found</TableCell>
                                    <TableCell>Resource not found</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-red-500">429</Badge></TableCell>
                                    <TableCell>Too Many Requests</TableCell>
                                    <TableCell>Rate limit exceeded</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell><Badge className="bg-red-500">500</Badge></TableCell>
                                    <TableCell>Internal Server Error</TableCell>
                                    <TableCell>Server error occurred</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ApiDocumentationIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'API Documentation', href: '/admin/api-documentation' },
    ],
};

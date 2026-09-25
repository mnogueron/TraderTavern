import { useClientQuery } from '@trader-tavern/api-client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Section, SectionContent } from '@/components/Section';
import EmptyCell from '@/components/EmptyCell';
import { formatDateTime } from '@/lib/format';

const MarketsSettings = () => {
  const { data: markets, isPending } = useClientQuery(
    'get',
    '/api/finance/markets',
  );

  return (
    <Section title="Markets">
      <SectionContent>
        {isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <Table containerClassName="rounded-lg border border-input">
            <TableHeader>
              <TableRow>
                <TableHead>Market</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Last complete sync</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!markets || markets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No markets available.
                  </TableCell>
                </TableRow>
              ) : (
                markets.map((market) => (
                  <TableRow key={market.market}>
                    <TableCell className="font-medium">
                      {market.market}
                    </TableCell>
                    <TableCell>
                      {market.label ?? (
                        <span className="text-muted-foreground">
                          Unconfigured
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {market.lastCompleteSync ? (
                        formatDateTime(market.lastCompleteSync)
                      ) : (
                        <EmptyCell />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </SectionContent>
    </Section>
  );
};

export default MarketsSettings;
